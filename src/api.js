import axios from 'axios';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
export const api = axios.create({ baseURL: SERVER_URL });
export const getToken = () => localStorage.getItem('token') || '';

export async function register(username, password, confirm, gender='O'){
  const { data } = await api.post('/api/auth/register', { username, password, confirm, gender });
  return data;
}
export async function login(username, password){
  const { data } = await api.post('/api/auth/login', { username, password });
  return data;
}
export async function listRooms(){
  const { data } = await api.get('/api/rooms');
  return data;
}
export async function changePassword(oldPass, newPass, confirm){
  const { data } = await api.post('/api/user/change-password', { oldPass, newPass, confirm }, { headers:{ Authorization:'Bearer '+getToken() } });
  return data;
}
export async function adminUsers(){
  const { data } = await api.get('/api/admin/users', { headers:{ Authorization:'Bearer '+getToken() } });
  return data;
}
export async function setGlobalRole(userId, role){
  const { data } = await api.post(`/api/admin/users/${userId}/global-role`, { role }, { headers:{ Authorization:'Bearer '+getToken() } });
  return data;
}
export async function fetchRooms(){
  const { data } = await api.get('/api/rooms');
  return data;
}
export async function updateRoom(roomId, description){
  const { data } = await api.patch(`/api/admin/rooms/${roomId}`, { description }, { headers:{ Authorization:'Bearer '+getToken() } });
  return data;
}
export async function deleteRoom(roomId){
  const { data } = await api.delete(`/api/admin/rooms/${roomId}`, { headers:{ Authorization:'Bearer '+getToken() } });
  return data;
}