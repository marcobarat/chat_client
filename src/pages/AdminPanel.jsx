import React, { useEffect, useState } from 'react';
import { adminLogin, getOverview, setRoomOwner, setUserRole, kickUser, banUser, unbanUser, muteUser, unmuteUser } from '../api.js';

const ROLE_OPTIONS = ['user','mod','guide','sysop','admin','owner'];

export default function AdminPanel() {
  const [secret, setSecret] = useState('');
  const [name, setName] = useState('Admin');
  const [token, setToken] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (tkn) => {
    setLoading(true);
    try {
      const d = await getOverview(tkn || token);
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    const t = await adminLogin(secret, name);
    setToken(t);
    await load(t);
  };

  const changeRole = async (u, role, roomId) => {
    if (role === 'owner') {
      if (!roomId) return;
      await setRoomOwner(token, roomId, u.id);
    } else {
      await setUserRole(token, u.id, role);
    }
    await load();
  };

  const doKick = async (u) => { await kickUser(token, u.id); await load(); };
  const doBan = async (u) => {
    const min = parseInt(prompt('Minuti di ban?', '60') || '60', 10);
    const reason = prompt('Motivo ban?', '') || '';
    await banUser(token, u.id, min, reason);
    await load();
  };
  const doUnban = async (u) => { await unbanUser(token, u.id); await load(); };
  const doMute = async (u, roomId) => {
    const min = parseInt(prompt('Minuti di mute?', '10') || '10', 10);
    const reason = prompt('Motivo mute?', '') || '';
    await muteUser(token, u.id, roomId, min, reason);
    await load();
  };
  const doUnmute = async (u, roomId) => { await unmuteUser(token, u.id, roomId); await load(); };

  if (!token) {
    return (
      <div>
        <h3>Admin Login</h3>
        <input placeholder="Shared secret" value={secret} onChange={e=>setSecret(e.target.value)} />
        <input placeholder="Nome admin" value={name} onChange={e=>setName(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={onLogin} style={{ marginLeft: 8 }}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
        <h3>Pannello Admin</h3>
        <div>
          <button onClick={() => load()} disabled={loading}>{loading ? 'Aggiorno...' : 'Aggiorna'}</button>
        </div>
      </div>

      {data.map(r => (
        <div key={r.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:10, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div>
              <strong>{r.name}</strong> — {r.description || '—'} — <em>{r.occupants} online</em>
            </div>
            <div>Owner: <code>{r.ownerUserId || '—'}</code></div>
          </div>
          <table style={{ width: '100%', marginTop:8, borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>User</th>
                <th>Role</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {r.users.map(u => (
                <tr key={u.id} style={{ borderTop:'1px solid #eee' }}>
                  <td style={{ padding:'6px 4px' }}>{u.name} <small>({u.id})</small>{u.afk?' [AFK]':''}</td>
                  <td style={{ textAlign:'center' }}>{u.role}</td>
                  <td style={{ textAlign:'center' }}>
                    <select defaultValue={u.role} onChange={e => changeRole(u, e.target.value, r.id)}>
                      {ROLE_OPTIONS.map(x => <option key={x} value={x}>{x}</option>)}
                    </select>
                    <button onClick={() => doKick(u)} style={{ marginLeft: 6 }}>Kick</button>
                    <button onClick={() => doMute(u, r.id)} style={{ marginLeft: 6 }}>Mute</button>
                    <button onClick={() => doUnmute(u, r.id)} style={{ marginLeft: 6 }}>Unmute</button>
                    <button onClick={() => doBan(u)} style={{ marginLeft: 6 }}>Ban</button>
                    <button onClick={() => doUnban(u)} style={{ marginLeft: 6 }}>Unban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
