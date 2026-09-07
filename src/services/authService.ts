import { api } from './api'

export type AuthUser = { id: number; fullName: string; email: string; language: string; roles: string[] }
type AuthResponse = { data: { accessToken: string; user: AuthUser } }

export async function login(email: string, password: string) { const response = await api.post<AuthResponse>('/auth/login', { email, password }); localStorage.setItem('mekong_access_token', response.data.data.accessToken); return response.data.data.user }
export async function register(fullName: string, email: string, password: string) { const response = await api.post<AuthResponse>('/auth/register', { fullName, email, password, language: 'vi' }); localStorage.setItem('mekong_access_token', response.data.data.accessToken); return response.data.data.user }
export async function currentUser() { const response = await api.get<{ data: AuthUser }>('/auth/me'); return response.data.data }
export async function logout() { try { await api.post('/auth/logout') } finally { localStorage.removeItem('mekong_access_token') } }
