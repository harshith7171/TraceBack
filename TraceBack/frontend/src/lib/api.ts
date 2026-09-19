import { Memory, SearchResponse, KnowledgeGraphResponse, ActivityLog, UserProfile, NotificationItem } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('traceback_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('traceback_token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('traceback_token');
  }
}

function getHeaders(custom: Record<string, string> = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...custom };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function registerUser(email: string, password: string, fullName: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/api/auth/notifications`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function markNotificationsAsRead(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/notifications/read-all`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
}

export async function fetchMemories(type?: string, favorite?: boolean): Promise<Memory[]> {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.append('type', type);
  if (favorite) params.append('favorite', 'true');
  
  const res = await fetch(`${API_BASE}/api/memories?${params.toString()}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch memories');
  return res.json();
}

export async function fetchMemoryDetail(id: string): Promise<{ memory: Memory; related: Memory[] }> {
  const res = await fetch(`${API_BASE}/api/memories/${id}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch memory details');
  return res.json();
}

export async function searchMemories(query: string, filterType?: string): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query, filter_type: filterType }),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function uploadFile(file: File, customTitle?: string, tags?: string): Promise<Memory> {
  const formData = new FormData();
  formData.append('file', file);
  if (customTitle) formData.append('custom_title', customTitle);
  if (tags) formData.append('tags', tags);

  const res = await fetch(`${API_BASE}/api/memories/upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function createNote(title: string, content: string, tags?: string): Promise<Memory> {
  const res = await fetch(`${API_BASE}/api/memories/note`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, content, tags }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create note' }));
    throw new Error(err.detail || 'Failed to create note');
  }
  return res.json();
}

export async function saveLink(url: string, customTitle?: string): Promise<Memory> {
  const res = await fetch(`${API_BASE}/api/memories/link`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ url, custom_title: customTitle }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save link' }));
    throw new Error(err.detail || 'Failed to save link');
  }
  return res.json();
}

export async function toggleFavorite(id: string): Promise<{ id: string; is_favorite: boolean }> {
  const res = await fetch(`${API_BASE}/api/memories/${id}/favorite`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
}

export async function deleteMemory(id: string): Promise<{ status: string; id: string }> {
  const res = await fetch(`${API_BASE}/api/memories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete memory');
  return res.json();
}

export async function fetchKnowledgeGraph(): Promise<KnowledgeGraphResponse> {
  const res = await fetch(`${API_BASE}/api/knowledge-graph`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch knowledge graph');
  return res.json();
}

export async function fetchActivity(): Promise<ActivityLog[]> {
  const res = await fetch(`${API_BASE}/api/activity`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch activities');
  return res.json();
}

export async function triggerSeed(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/seed`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to seed');
  return res.json();
}
