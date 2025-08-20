import React, { useState } from 'react';
import { login } from '../api.js';
import { t } from '../i18n/init.js';

export default function Login({ onLogin }){
  const [u,setU] = useState('');
  const [p,setP] = useState('');
  const [msg,setMsg] = useState('');

  const submit = async () => {
    try{
      const { token } = await login(u,p);
      onLogin(token);
    }catch(e){ setMsg(e?.response?.data?.error || 'Errore'); }
  };

  return (
    <div className="card" style={{ maxWidth:480, margin:'40px auto', padding:16 }} onKeyDown={(e)=>{ if(e.key==='Enter') submit(); }}>
      <div className="stack">
        <div className="room-title">{t('login')}</div>
        <input placeholder={t('username')} value={u} onChange={e=>setU(e.target.value)} />
        <input type="password" placeholder={t('password')} value={p} onChange={e=>setP(e.target.value)} />
        {msg && <div className="system">{msg}</div>}
        <button onClick={submit}>{t('login')}</button>
      </div>
    </div>
  );
}