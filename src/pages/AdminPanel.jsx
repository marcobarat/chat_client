import React, { useEffect, useState } from 'react';
import { adminUsers, setGlobalRole, fetchRooms, updateRoom, deleteRoom } from '../api.js';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../api.js';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(()=>{
    adminUsers().then(setUsers).catch(()=>{});
    fetchRooms().then(setRooms).catch(()=>{});
    const token = localStorage.getItem('token') || '';
    const s = io(SERVER_URL, { auth: { token } });
    s.on('admin:users', setUsers);
    s.on('admin:rooms', setRooms);
    s.on('rooms:update', setRooms);
    return ()=>s.disconnect();
  },[]);

  return (
    <div className="grid2" style={{ alignItems:'start' }}>
      <div className="card" style={{ padding: 12 }}>
        <h3>Utenti</h3>
        <table className="table">
          <thead><tr><th>Username</th><th>Genere</th><th>Ruolo</th><th>Azioni</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.gender}</td>
                <td>{u.global_role}</td>
                <td>
                  {['user','mod','guide','sysop','admin'].map(r => (
                    <button key={r} onClick={async()=>{ await setGlobalRole(u.id, r); }} style={{ marginRight:6 }}>{r}</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <h3>Stanze</h3>
        {rooms.map(r => (
          <div key={r.id} className="row" style={{ justifyContent:'space-between', borderTop:'1px solid #1b2753', paddingTop:8, marginTop:8 }}>
            <div><strong>{r.name}</strong> — <span className="tag">{r.description}</span> — <span className="badge">{r.occupants} online</span></div>
            <div className="row">
              <button onClick={async()=>{ const d=prompt('Nuova descrizione', r.description||''); if(d!==null){ await updateRoom(r.id,d); } }}>Descrizione</button>
              <button onClick={async()=>{ if(confirm('Eliminare la stanza?')){ await deleteRoom(r.id); } }} style={{ background:'linear-gradient(180deg,#ff5670,#d53955)'}}>Elimina</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}