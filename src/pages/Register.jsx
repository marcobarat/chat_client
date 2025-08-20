import React, { useState } from 'react';
import { register } from '../api.js';
import { t } from '../i18n/init.js';

export default function Register({ onDone }){
  const [u,setU]=useState('');
  const [p,setP]=useState('');
  const [c,setC]=useState('');
  const [g,setG]=useState('O');
  const [msg,setMsg]=useState('');

  const submit = async ()=>{
    try{
      const r = await register(u,p,c,g);
      const tok = r?.token;
      if(tok){ onDone(tok); } else { setMsg('Registrato. Effettua l\'accesso.'); }
    }catch(e){ setMsg(e?.response?.data?.error || 'Errore'); }
  };

  return (
    <div className="card" style={{ maxWidth:520, margin:'40px auto', padding:16 }} onKeyDown={(e)=>{ if(e.key==='Enter') submit(); }}>
      <div className="stack">
        <div className="room-title">{t('register')}</div>
        <input placeholder={t('username')} value={u} onChange={e=>setU(e.target.value)} />
        <div className="row">
          <input type="password" placeholder={t('password')} value={p} onChange={e=>setP(e.target.value)} style={{ flex:1 }} />
          <input type="password" placeholder={t('confirm')} value={c} onChange={e=>setC(e.target.value)} style={{ flex:1 }} />
        </div>
        <select value={g} onChange={e=>setG(e.target.value)}>
          <option value="M">Maschio</option>
          <option value="F">Femmina</option>
          <option value="O">Altro/Non specificato</option>
        </select>
        {msg && <div className="system">{msg}</div>}
        <button onClick={submit}>{t('register')}</button>
      </div>
    </div>
  );
}