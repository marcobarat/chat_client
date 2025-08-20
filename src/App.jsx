import React, { useEffect, useState } from 'react';
import { t } from './i18n/init.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import RoomsList from './pages/RoomsList.jsx';
import ChatRoom from './pages/ChatRoom.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import Profile from './pages/Profile.jsx';

function parseJwt(token){
  try{ const b=token.split('.')[1]; return JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/'))); }catch{ return {}; }
}

export default function App(){
  const [token,setToken] = useState(localStorage.getItem('token')||'');
  const [page,setPage] = useState(token ? 'rooms' : 'login');
  const [isAdmin,setIsAdmin] = useState(false);
  const [roomReq,setRoomReq] = useState(null);
  const [theme,setTheme] = useState(localStorage.getItem('theme')||'dark');
  const [unread,setUnread] = useState(0);

  useEffect(()=>{ document.documentElement.classList.toggle('light', theme==='light'); localStorage.setItem('theme', theme); },[theme]);
  useEffect(()=>{
    token ? setPage(page==='chat'?'chat':'rooms') : setPage('login');
    const p=parseJwt(token); setIsAdmin(p?.globalRole==='admin');
  },[token]);

  const logout = () => { localStorage.removeItem('token'); setToken(''); setPage('login'); };

  return (
    <div>
      <div className="header">
        <div className="row">
          <strong>Berry Chat</strong> {unread>0 && <span className='badge-dot' title={`${unread} nuovi`}></span>}
          <button onClick={()=>setPage('rooms')}>{t('rooms')}</button>
          {isAdmin && <button onClick={()=>setPage('admin')}>{t('admin_panel')}</button>}
          {token && <button onClick={()=>setPage('profile')}>{t('profile')}</button>}
          <button onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'🌙':'☀️'}</button>
        </div>
        <div className="row">
          {token ? (
            <button onClick={logout}>{t('logout')}</button>
          ) : (
            <>
              <button onClick={()=>setPage('login')}>{t('login')}</button>
              <button onClick={()=>setPage('register')}>{t('register')}</button>
            </>
          )}
        </div>
      </div>

      <div className="container">
        {page==='login' && <Login onLogin={(tok)=>{ localStorage.setItem('token',tok); setToken(tok); setPage('rooms'); }} />}
        {page==='register' && <Register onDone={(tok)=>{ if(tok){ localStorage.setItem('token',tok); setToken(tok); setPage('rooms'); } else { setPage('login'); } }} />}
        {page==='rooms' && token && <RoomsList onEnterRoom={(r)=>{ setRoomReq(r); setPage('chat'); }} />}
        {page==='chat' && token && <ChatRoom roomId={roomReq} token={token} onExit={()=>setPage('rooms')} onUnreadChange={setUnread} />}
        {page==='admin' && isAdmin && <AdminPanel />}
        {page==='profile' && token && <Profile onClose={()=>setPage('rooms')} />}
      </div>
    </div>
  );
}