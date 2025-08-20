import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../api.js';
import UserList from '../components/UserList.jsx';
import PrivateMessages from '../components/PrivateMessages.jsx';
import RoleIcon from '../components/RoleIcon.jsx';

export default function ChatRoom({ roomId, onExit, socketRef }) {
  const [nick, setNick] = useState('');
  const [askedNick, setAskedNick] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [pm, setPm] = useState([]);
  const [afk, setAfk] = useState(false);
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    const sock = socketRef.current || io(SERVER_URL, { autoConnect: true });
    if (!socketRef.current) socketRef.current = sock;

    const onJoined = ({ users }) => setUsers(users);
    const onUserList = (list) => setUsers(list);
    const onMessage = (msg) => setMessages(prev => [...prev, msg]);
    const onPm = (m) => setPm(prev => [...prev, { ...m, peer: (m.from?.id ? m.from : m.to) }]);
    const onKicked = () => { alert('Sei stato espulso dalla stanza.'); onExit(); };

    sock.on('room:joined', onJoined);
    sock.on('room:user_list', onUserList);
    sock.on('chat:message', onMessage);
    sock.on('chat:pm', onPm);
    sock.on('mod:kicked', onKicked);

    return () => {
      sock.off('room:joined', onJoined);
      sock.off('room:user_list', onUserList);
      sock.off('chat:message', onMessage);
      sock.off('chat:pm', onPm);
      sock.off('mod:kicked', onKicked);
    };
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const join = () => {
    if (!socketRef.current) return;
    if (!nick.trim()) return;
    socketRef.current.emit('room:join', { roomId, name: nick.trim() });
    setAskedNick(true);
  };

  const send = () => {
    const v = inputRef.current.value.trim();
    if (!v) return;
    socketRef.current.emit('chat:message', { text: v });
    inputRef.current.value = '';
  };

  const sendPm = (toUserId, text) => {
    if (!text?.trim() || !toUserId) return;
    socketRef.current.emit('chat:pm', { toUserId, text });
  };

  const toggleAfk = () => {
    setAfk(a => {
      const next = !a;
      socketRef.current.emit('user:afk', { afk: next });
      return next;
    });
  };

  if (!askedNick) {
    return (
      <div>
        <h3>Entra nella stanza</h3>
        <input placeholder="Scegli un nickname" value={nick} onChange={e=>setNick(e.target.value)} />
        <button onClick={join}>Entra</button>
        <button onClick={onExit}>Indietro</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div><button onClick={onExit}>⬅ Torna alle stanze</button></div>
        <div>
          <label style={{ marginRight: 8 }}>
            <input type="checkbox" checked={afk} onChange={toggleAfk} /> AFK
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div ref={logRef} style={{ border: '1px solid #cbd5ff', background:'#f0f4ff', borderRadius: 6, padding: 8, height: 360, overflow: 'auto' }}>
            {messages.map(m => (
              <div key={m.id} style={{ marginBottom: 6 }}>
                <RoleIcon role={m.from.role} />
                <strong title={m.from.role} style={{ color: m.from.role === 'owner' ? '#b58900' : (m.from.role === 'mod' ? '#8b4513' : '#222') }}>
                  {m.from.name}
                </strong>: {m.text}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input ref={inputRef} placeholder="Scrivi un messaggio..." style={{ flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter') send(); }} />
            <button onClick={send}>Invia</button>
          </div>
          <PrivateMessages pmList={pm} onSendPm={sendPm} />
        </div>

        <UserList users={users} onPmClick={(u) => sendPm(u.id, prompt(`PM a ${u.name}:`) || '')} />
      </div>
    </div>
  );
}
