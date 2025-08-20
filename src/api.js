import axios from 'axios';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: SERVER_URL });

export const adminLogin = async (sharedSecret, adminName) => {
  const { data } = await api.post('/api/admin/login', { sharedSecret, adminName });
  return data.token;
};

export const fetchRooms = async () => {
  const { data } = await api.get('/api/rooms');
  return data;
};

export const getOverview = async (token) => {
  const { data } = await api.get('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } });
  return data;
};

export const setRoomOwner = async (token, roomId, userId) => {
  const { data } = await api.post(`/api/admin/rooms/${roomId}/owner`, { userId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const setUserRole = async (token, userId, role) => {
  const { data } = await api.post(`/api/admin/users/${userId}/role`, { role }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const kickUser = async (token, userId) => {
  const { data } = await api.post(`/api/admin/users/${userId}/kick`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const banUser = async (token, userId, minutes, reason) => {
  const { data } = await api.post(`/api/admin/users/${userId}/ban`, { minutes, reason }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const unbanUser = async (token, userId) => {
  const { data } = await api.post(`/api/admin/users/${userId}/unban`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const muteUser = async (token, userId, roomId, minutes, reason) => {
  const { data } = await api.post(`/api/admin/users/${userId}/mute`, { roomId, minutes, reason }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const unmuteUser = async (token, userId, roomId) => {
  const { data } = await api.post(`/api/admin/users/${userId}/unmute`, { roomId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};
