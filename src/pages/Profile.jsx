import React, { useEffect, useState } from 'react';
import { changePassword } from '../api.js';

export default function Profile({ onClose }) {
  const [username, setUsername] = useState('');
  const [oldPass, setOld] = useState('');
  const [np, setNp] = useState('');
  const [cp, setCp] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(()=>{
    try {
      const tok = localStorage.getItem('token')||'';
      const payload = JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))||'{}');
      setUsername(payload?.username || '');
    } catch {}
  },[]);

  const submit = async ()=>{
    try {
      await changePassword(oldPass, np, cp);
      setMsg('Password aggiornata ✔');
      setOld(''); setNp(''); setCp('');
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Errore');
    }
  };

  return (
    <div className="card" style={{ padding: 14, maxWidth: 520, margin: '40px auto' }} onKeyDown={(e)=>{ if(e.key==='Enter') submit(); }}>
      <div className="room-title" style={{ marginBottom: 8 }}>Profilo</div>
      <div className="stack">
        <label>Username</label>
        <input value={username} readOnly />
        <label>Password attuale</label>
        <input type="password" value={oldPass} onChange={e=>setOld(e.target.value)} />
        <div className="row">
          <input type="password" placeholder="Nuova password" value={np} onChange={e=>setNp(e.target.value)} style={{ flex:1 }} />
          <input type="password" placeholder="Conferma" value={cp} onChange={e=>setCp(e.target.value)} style={{ flex:1 }} />
        </div>
        {msg && <div className="system">{msg}</div>}
        <div className="row" style={{ justifyContent:'space-between' }}>
          <button onClick={submit}>Aggiorna password</button>
          <button onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}