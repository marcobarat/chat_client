import React from 'react';

const ICONS = {
  mod: '/icons/hammer_brown.png',
  owner: '/icons/hammer_gold.png',
  butterfly: '/icons/butterfly.png'
};

export default function RoleIcon({ role, size=14 }) {
  let src = null;
  if (role === 'owner') src = ICONS.owner;
  else if (role === 'mod') src = ICONS.mod;
  else if (['admin','sysop','guide'].includes(role)) src = ICONS.butterfly;
  if (!src) return null;
  return <img src={src} alt={role} width={size} height={size} style={{ verticalAlign: 'middle', marginRight: 4 }} />;
}
