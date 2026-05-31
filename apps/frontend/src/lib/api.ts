import type { AdminStats, AuthPayload, Notification, Post, Profile, User } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');
const TOKEN_KEY = 'social-mvp-token';

export const tokenStore = {
  get: () => window.localStorage.getItem(TOKEN_KEY),
  set: (token: string) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? 'Backend недоступен');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<User>('/auth/me'),
  login: (email: string, password: string) => request<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, username: string, password: string, name: string) => request<AuthPayload>('/auth/register', { method: 'POST', body: JSON.stringify({ email, username, password, name }) }),
  feed: () => request<Post[]>('/posts'),
  createPost: (content: string) => request<Post>('/posts', { method: 'POST', body: JSON.stringify({ content }) }),
  like: (id: string) => request<{ liked: boolean }>(`/posts/${id}/like`, { method: 'POST' }),
  comment: (id: string, content: string) => request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  search: (q: string) => request<User[]>(`/users/search?q=${encodeURIComponent(q)}`),
  user: (username: string) => request<User>(`/users/${username}`),
  userPosts: (username: string) => request<Post[]>(`/posts/user/${username}`),
  updateProfile: (profile: Pick<Profile, 'name' | 'bio' | 'city' | 'website'>) => request<Profile>('/users/me/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  follow: (username: string) => request(`/users/${username}/follow`, { method: 'POST' }),
  unfollow: (username: string) => request(`/users/${username}/follow`, { method: 'DELETE' }),
  notifications: () => request<Notification[]>('/notifications'),
  readNotifications: () => request('/notifications/read', { method: 'POST' }),
  adminStats: () => request<AdminStats>('/admin/stats'),
  adminUsers: () => request<User[]>('/admin/users')
};
