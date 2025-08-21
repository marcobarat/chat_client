import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "../api.js";
import { t } from "../i18n/init.js";

const COMMON_EMOJI = ["😀","😂","😍","😎","😭","🤔","🙌","🔥","🎉","❤️","👍","☕"];
const pad = (n) => (n < 10 ? "0" : "") + n;
function fmt(ts){ const d=new Date(ts); return pad(d.getHours())+":"+pad(d.getMinutes()); }
function dayLabel(ts){ const d=new Date(ts); return d.toLocaleDateString(); }
export function autolink(text){
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a class="autolink" target="_blank" rel="noreferrer" href="$1">$1</a>'
  );
}
export function highlightMentions(text, you){
  if(!you) return text;
  const re = new RegExp("@"+you.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"), "ig");
  return text.replace(re, '<span class="mention">$&</span>');
}
export function limitMessage(text){
  return text.slice(0,255);
}
function emojiRender(text){ return text.replace(/:coffee:/g,"☕").replace(/:heart:/g,"❤️"); }

function ContextMenu({ x, y, onClose, actions = [] }) {
  if (x === null) return null;
  return (
    <div className="card" style={{ position:"fixed", left:x, top:y, padding:8, zIndex:50 }} onMouseLeave={onClose}>
      {actions.map((a,i)=>(
        <div key={i} className="row" style={{ padding:"6px 4px", cursor:"pointer" }}
             onClick={()=>{ a.onClick(); onClose(); }}>{a.label}</div>
      ))}
    </div>
  );
}
function Modal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="row" style={{ justifyContent:"space-between" }}>
          <div className="room-title">{title}</div>
          <button onClick={onClose}>✕</button>
        </div>
        <div style={{ marginTop:10 }}>{children}</div>
      </div>
    </div>
  );
}

export default function ChatRoom({ roomId: roomArg, onExit, token, onUnreadChange }) {
  const [sock, setSock] = useState(null);
  const [roomId, setRoomId] = useState(typeof roomArg === "object" ? roomArg.id : roomArg);
  const [you, setYou] = useState(null);
  const [messages, setMessages] = useState([]);
  // Track the number of users in the room. Start from 0 instead of an empty array
  // so the initial render shows "0" users rather than nothing.
  const [countUsers, setCountUsers] = useState(0);
  const [users, setUsers] = useState([]);
  const inputRef = useRef(null);
  const [menu, setMenu] = useState({ x: null, y: null, target: null });
  const [pmOpen, setPmOpen] = useState(false);
  const [pmTarget, setPmTarget] = useState(null);
  const [pmText, setPmText] = useState("");
  const [ownerPw, setOwnerPw] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState(null);
  const typingTimer = useRef(null);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef(null);
  const atBottomRef = useRef(true);
  const fileRef = useRef(null);

  // Autoscroll
  const logRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  };

  // Banner “nuovi messaggi sotto”
  const [pendingBelow, setPendingBelow] = useState(0);

  useEffect(() => {
    const s = io(SERVER_URL, { auth: { token } });
    setSock(s);

    s.on("room:joined", (p) => {
      setUsers(p.users); setYou(p.you); setRoomId(p.roomId);
      try { const u = new URL(window.location.href); u.searchParams.set("room", p.roomId); window.history.replaceState({}, "", u.toString()); } catch {}
      setTimeout(() => { try { inputRef.current?.focus(); } catch {} }, 50);
      setTimeout(() => { scrollToBottom("auto"); setPendingBelow(0); }, 60);
    });
      
    s.on("room:user_list", (arr) => {
      setUsers(arr);
      setCountUsers(arr.length);
    });

    s.on("chat:history", (arr) => {
      setMessages(arr);
      setPendingBelow(0);
      setTimeout(() => scrollToBottom("auto"), 0);
    });

    s.on("chat:message", (m) => {
      setMessages((prev) => {
        const next = [...prev, { ...m, text: emojiRender(m.text) }];
        try {
          if (soundOn) {
            if (audioRef.current) { audioRef.current.currentTime = 0; }
            audioRef.current?.play().catch(() => {});
          }
        } catch {}
        if (!atBottomRef.current || document.hidden) {
          onUnreadChange?.((x) => (x || 0) + 1);
          setPendingBelow((n) => n + 1);
        } else {
          // già in fondo → mantieni in fondo
          requestAnimationFrame(() => scrollToBottom("auto"));
        }
        return next;
      });
    });

    s.on("chat:system", (m) =>
      setMessages((prev) => [
        ...prev,
        { id: String(Math.random()), system: true, text: m.text, kind: m.kind, ts: m.ts },
      ])
    );

    s.on("room:owner_password", ({ password }) => setOwnerPw(password));

    s.on("chat:pm", (pm) => { setPmTarget(pm.from); setPmOpen(true); setPmText(pm.text || ""); });

    s.on("room:created", ({ roomId, password }) => {
      setOwnerPw(password); setRoomId(roomId);
      const u = new URL(window.location.href); u.searchParams.set("room", roomId); window.history.replaceState({}, "", u.toString());
      s.emit("room:join", { roomId });
    });

    s.on("chat:typing", (p) => {
      setTyping(p.name + " sta scrivendo...");
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 1500);
    });

    s.on("error", (e) => {
      const m = typeof e === "string" ? e : e?.message || "Errore";
      setMessages((prev) => [...prev, { id:String(Math.random()), system:true, text:m, kind:"error", ts:Date.now() }]);
    });

    if (typeof roomArg === "object" && roomArg?.create) {
      s.emit("room:create", { name: roomArg.name, description: roomArg.description });
    } else if (roomId) {
      s.emit("room:join", { roomId: roomId, roomName: roomId });
    } else {
      const url = new URL(window.location.href);
      const qRoom = url.searchParams.get("room");
      if (qRoom) { setRoomId(qRoom); s.emit("room:join", { roomId: qRoom, roomName: qRoom }); }
    }

    return () => {
      s.emit("room:disconnection", { roomId: roomId, roomName: roomId });
      s.disconnect();
    };
  }, []);

  // Autoscroll quando già in fondo
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom("auto");
  }, [messages]);

  const send = () => {
    const v = limitMessage(inputRef.current.value.trim());
    if (!v) return;
    onUnreadChange?.(0);
    setPendingBelow(0);
    sock.emit("chat:message", { text: v });
    inputRef.current.value = "";
    scrollToBottom("smooth");
    atBottomRef.current = true;
  };

  const toggleAfk = (e) => sock.emit("user:afk", { afk: e.target.checked });
  const onUserRightClick = (e, u) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, target: u }); };

  const actionsForUser = (u) => {
    if (!you) return [];
    const isButterfly = ["admin","sysop","guide"].includes(you.role);
    const isOwner = you.role === "owner";
    const isMod = you.role === "mod";
    const own = you.id === u.id;
    const items = [];
    if (!own) {
      items.push({ label:"PM", onClick:()=>{ setPmTarget(u); setPmOpen(true); } });
      items.push({ label:"Blocca", onClick:()=> sock.emit("user:block",{ userId:u.id }) });
      items.push({ label:"Sblocca", onClick:()=> sock.emit("user:unblock",{ userId:u.id }) });
    }
    if (isButterfly || isOwner || isMod) {
      items.push({ label:"Kick", onClick:()=> sock.emit("mod:kick",{ targetUserId:u.id }) });
      if (isButterfly || isOwner) {
        items.push({ label:"Nomina Moderatore", onClick:()=> sock.emit("room:role_set",{ targetUserId:u.id, role:"mod" }) });
        items.push({ label:"Togli Moderatore", onClick:()=> sock.emit("room:role_set",{ targetUserId:u.id, role:"user" }) });
        if (isButterfly) items.push({ label:"Nomina Owner", onClick:()=> sock.emit("room:role_set",{ targetUserId:u.id, role:"owner" }) });
        items.push({ label:"Banna 1h", onClick:()=> sock.emit("mod:ban",{ targetUserId:u.id, durationMinutes:60, reason:"violazione" }) });
        items.push({ label:"Banna 1g", onClick:()=> sock.emit("mod:ban",{ targetUserId:u.id, durationMinutes:1440, reason:"violazione" }) });
        items.push({ label:"Bannaa permanente", onClick:()=> sock.emit("mod:ban",{ targetUserId:u.id, durationMinutes:0, reason:"violazione" }) });
        items.push({ label:"Rimuovi ban", onClick:()=> sock.emit("mod:unban",{ targetUserId:u.id }) });
      }
    }
    return items;
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    const resp = await fetch((import.meta.env.VITE_SERVER_URL || "http://localhost:4000") + "/api/upload", {
      method: "POST", headers: { Authorization: "Bearer " + localStorage.getItem("token") }, body: fd
    });
    if (!resp.ok){ alert("Upload fallito"); return; }
    const { url } = await resp.json();
    sock.emit("chat:message", { text: url });
  };

  return (
    <div className="grid2">
      <div className="card">
        <div
          className="chat-log"
          ref={logRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const wasBottom = atBottomRef.current;
            atBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
            if (atBottomRef.current) { onUnreadChange?.(0); setPendingBelow(0); }
            // se l'utente risale, non azzerare pendingBelow
            if (!atBottomRef.current && wasBottom) {
              // appena esce dal fondo rimani pronto a mostrare banner
            }
          }}
          style={{ position:"relative" }}
        >
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const showDay = !prev || dayLabel(prev.ts) !== dayLabel(m.ts);
            return (
              <React.Fragment key={m.id}>
                {showDay && <div className="day-sep">— {dayLabel(m.ts)} —</div>}
                {m.system ? (
                  <div className="system">★ {m.text}</div>
                ) : (
                  <div className="chat-msg">
                    <div className="meta">{fmt(m.ts)}</div>
                    <div className="bubble">
                      <strong>{m.from.name}</strong>:{" "}
                      {/\.(png|jpg|jpeg|gif|webp)$/i.test(m.text.trim()) ? (
                        <img src={m.text} alt="img" style={{ maxWidth:"100%", borderRadius:8 }} />
                      ) : (
                        <span
                          dangerouslySetInnerHTML={{ __html: highlightMentions(autolink(m.text), you) }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* ancora per autoscroll */}
          <div ref={messagesEndRef} />

          {typing && <div className="typing">{typing}</div>}

          {/* Banner “nuovi messaggi sotto” */}
          {pendingBelow > 0 && !atBottomRef.current && (
            <button
              onClick={() => { scrollToBottom("smooth"); setPendingBelow(0); onUnreadChange?.(0); }}
              style={{
                position:"sticky", bottom:8, left:"calc(100% - 12px)",
                transform:"translateX(-100%)",
                background:"linear-gradient(180deg,#2e58a0,#244781)",
                color:"#fff", border:"none", borderRadius:20, padding:"6px 10px",
                boxShadow:"0 6px 16px rgba(0,0,0,.25)", cursor:"pointer", opacity:.95
              }}
              title="Vai all’ultimo"
            >
              ⬇︎ {pendingBelow} nuovi messaggi
            </button>
          )}
        </div>

        <div style={{ padding:10 }}>
          <div className="row">
            <input
              ref={inputRef}
              placeholder={t("type_message")}
              className="chat-input"
              maxLength={255}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  send();
                } else {
                  try { sock.emit("chat:typing"); } catch {}
                }
              }}
            />
            <button onClick={send}>{t("send")}</button>
            <button onClick={() => setShowEmoji((v) => !v)}>😊</button>
            <button onClick={() => fileRef.current?.click()}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={(e)=>handleUpload(e.target.files[0])} />
            <label className="row" style={{ marginLeft:8 }}>
              <input type="checkbox" onChange={(e)=>sock.emit("user:afk",{afk:e.target.checked})} /> {t("afk")}
            </label>
            {you && ["admin","sysop","guide"].includes(you.role) && (
              <button onClick={()=>{ const msg = prompt("Messaggio broadcast"); if (msg) sock.emit("chat:broadcast", { text: msg }); }}>
                {t("broadcast")}
              </button>
            )}
            {you && (
              <button onClick={()=>{ const pw = prompt("Password stanza"); if (pw) sock.emit("room:owner_claim", { roomId, password: pw }); }}>
                {t("claim_owner")}
              </button>
            )}
            <label className="row" style={{ marginLeft:8 }}>
              <input type="checkbox" checked={soundOn} onChange={(e)=>setSoundOn(e.target.checked)} />🔊
            </label>
          </div>

          {showEmoji && (
            <div className="row" style={{ flexWrap:"wrap", gap:6, marginTop:6 }}>
              {COMMON_EMOJI.map((e) => (
                <button key={e} onClick={()=>{ inputRef.current.value += e; inputRef.current.focus(); }}>{e}</button>
              ))}
            </div>
          )}
          {ownerPw && (
            <div className="tag">
              {t("owner_password")}: <code>{ownerPw}</code>
            </div>
          )}
          <audio ref={audioRef} src="/notify.mp3" preload="auto" />
        </div>
      </div>

      <div className="userlist">
        <div className="row" style={{ justifyContent:"space-between" }}>
          <div className="room-title">{t("users")}: {countUsers} </div>
          <button onClick={onExit}>⬅</button>
        </div>
        <div className="stack" style={{ marginTop:8 }}>
          {users.map((u) => (
            <div key={u.id} className="user-item" onContextMenu={(e)=>{ e.preventDefault(); setMenu({ x:e.clientX, y:e.clientY, target:u }); }}>
              <div className="user-left">
                <img
                  className="icon"
                  src={
                    u.role === "owner" ? "/icons/hammer_gold.png"
                    : u.role === "mod" ? "/icons/hammer_brown.png"
                    : ["admin","sysop","guide"].includes(u.role) ? "/icons/butterfly.png"
                    : "/icons/user_green.png"
                  }
                />
                <div>{u.name}{u.afk ? " ☕" : ""}</div>
              </div>
              <span className="badge">{u.role}</span>
            </div>
          ))}
        </div>
      </div>

      <ContextMenu
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu({ x:null, y:null, target:null })}
        actions={menu.target ? actionsForUser(menu.target) : []}
      />
      <Modal title={`PM ${pmTarget?.name || ""}`} open={pmOpen} onClose={() => setPmOpen(false)}>
        <div className="stack">
          <input
            placeholder="Scrivi un messaggio privato..."
            value={pmText}
            onChange={(e)=>setPmText(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==="Enter"){ sock.emit("chat:pm",{ toUserId: pmTarget.id, text: pmText }); setPmText(""); } }}
          />
          <div className="row" style={{ justifyContent:"flex-end" }}>
            <button onClick={()=>{ sock.emit("chat:pm",{ toUserId: pmTarget.id, text: pmText }); setPmText(""); }}>Invia PM</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
