import React, { useState } from 'react';

export default function PrivateMessages({ pmList, onSendPm }) {
  const [text, setText] = useState('');
  const [to, setTo] = useState(pmList[0]?.peer?.id || '');

  return (
    <div style={{ borderTop: '1px solid #ddd', paddingTop: 8 }}>
      <h4>Messaggi Privati</h4>
      <div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid #eee', padding: 8, marginBottom: 8, background: '#fafbfd' }}>
        {pmList.map(pm => (
          <div key={pm.id} style={{ marginBottom: 6 }}>
            <strong>{pm.from.name}</strong> → <strong>{pm.to.name}</strong>: {pm.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="User ID destinatario" value={to} onChange={e => setTo(e.target.value)} style={{ flex: 1 }}/>
        <input placeholder="Scrivi un PM..." value={text} onChange={e => setText(e.target.value)} style={{ flex: 2 }}/>
        <button onClick={() => { onSendPm(to, text); setText(''); }}>Invia</button>
      </div>
    </div>
  );
}
