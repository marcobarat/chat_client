import React, { useRef, useState } from 'react';
import RoomsList from './pages/RoomsList.jsx';
import ChatRoom from './pages/ChatRoom.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

export default function App() {
  const [roomId, setRoomId] = useState(null);
  const [admin, setAdmin] = useState(false);
  const socketRef = useRef(null);

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>MSN Chat (clone)</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setAdmin(false)} disabled={!admin}>Chat</button>
          <button onClick={() => setAdmin(true)}>Admin</button>
        </div>
      </header>

      {!admin ? (
        !roomId ? (
          <RoomsList onEnterRoom={setRoomId} socketRef={socketRef} />
        ) : (
          <ChatRoom roomId={roomId} onExit={() => setRoomId(null)} socketRef={socketRef} />
        )
      ) : (
        <AdminPanel />
      )}
    </div>
  );
}
