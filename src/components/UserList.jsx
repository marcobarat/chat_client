import React from 'react';
import RoleIcon from '../components/RoleIcon.jsx';

export default function UserList({ users, onPmClick }) {
  return (
    <div style={{ borderLeft: '1px solid #ddd', paddingLeft: 12, width: 240 }}>
      <h4>Utenti</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {users.map(u => (
          <li key={u.id} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span title={u.role}>
              <RoleIcon role={u.role} />{' '}
              <span style={{ opacity: u.afk ? 0.6 : 1 }}>{u.name}{u.afk ? ' (AFK)' : ''}</span>
            </span>
            <button onClick={() => onPmClick(u)} title="Messaggio privato">PM</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
