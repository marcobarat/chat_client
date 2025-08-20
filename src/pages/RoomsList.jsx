import React, { useEffect, useState } from 'react';
import { fetchRooms, SERVER_URL } from '../api.js';
import { io } from 'socket.io-client';

export default function RoomsList({ onEnterRoom, socketRef }) {
  const [rooms, setRooms] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    fetchRooms().then(setRooms);
    const sock = socketRef.current || io(SERVER_URL, { autoConnect: true });
    if (!socketRef.current) socketRef.current = sock;

    const handleUpdate = (list) => setRooms(list);
    const handleList = (list) => setRooms(list);

    sock.on('rooms:update', handleUpdate);
    sock.on('rooms:list', handleList);
    sock.emit('room:list');

    return () => {
      sock.off('rooms:update', handleUpdate);
      sock.off('rooms:list', handleList);
    };
  }, []);

  const createRoom = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('room:create', { name, description: desc });
    setCreating(false);
    setName(''); setDesc('');
  };

  return (
    <div>
      <h3>Stanze disponibili</h3>
      <button onClick={() => setCreating(v => !v)}>{creating ? 'Annulla' : 'Crea stanza'}</button>
      {creating && (
        <div style={{ margin: '12px 0', display: 'flex', gap: 8 }}>
          <input placeholder="Nome stanza" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Descrizione" value={desc} onChange={e=>setDesc(e.target.value)} />
          <button onClick={createRoom}>Crea</button>
        </div>
      )}
      <ul>
        {rooms.map(r => (
          <li key={r.id} style={{ marginBottom: 8, background:'#f7f9ff', padding:'6px 8px', borderRadius:6 }}>
            <strong>{r.name}</strong> — {r.description || '—'} — <em>{r.occupants} online</em>{' '}
            <button onClick={() => onEnterRoom(r.id)}>Entra</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
