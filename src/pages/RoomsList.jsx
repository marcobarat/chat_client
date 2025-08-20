import React, { useEffect, useState } from 'react';
import { listRooms } from '../api.js';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../api.js';
import { t } from '../i18n/init.js';

export default function RoomsList({ onEnterRoom }){
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(()=>{
    let alive = true;
    listRooms().then(r=>{ if(alive) setRooms(r); });
    const token = localStorage.getItem('token')||'';
    const s = io(SERVER_URL, { auth:{ token } });
    s.on('rooms:update', setRooms);
    return ()=>{ alive=false; s.disconnect(); };
  },[]);

  return (
    <div className="card" style={{ padding:16 }} onKeyDown={(e)=>{ if(e.key==='Enter'){ if(!name||!name.trim()) return alert('Inserisci un nome stanza'); onEnterRoom({ create:true, name:name.trim(), description: desc }); } }}>
      <div className="row" style={{ justifyContent:'space-between' }}>
        <div className="room-title">{t('rooms')}</div>
        <div className="row">
          <input placeholder={t('room_name')} value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder={t('description')} value={desc} onChange={e=>setDesc(e.target.value)} />
          <button onClick={()=>{ if(!name||!name.trim()) return alert('Inserisci un nome stanza'); onEnterRoom({ create:true, name:name.trim(), description: desc }); }}>{t('create_room')}</button>
        </div>
      </div>
      <div className="stack" style={{ marginTop:12 }}>
        {rooms.map(r=>(
          <div key={r.id} className="row" style={{ justifyContent:'space-between', borderTop:'1px solid #1b2753', paddingTop:8 }}>
            <div><strong>{r.name}</strong> — <span className="tag">{r.description}</span></div>
            <div className="row">
              <span className="badge">{r.occupants} online</span>
              <button onClick={()=>onEnterRoom(r.id)}>{t('enter_room')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}