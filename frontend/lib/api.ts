const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Token management ──────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('autoflow_token');
}

export function setToken(token: string, refreshToken?: string) {
  localStorage.setItem('autoflow_token', token);
  if (refreshToken) localStorage.setItem('autoflow_refresh', refreshToken);
}

export function clearToken() {
  localStorage.removeItem('autoflow_token');
  localStorage.removeItem('autoflow_refresh');
  localStorage.removeItem('autoflow_user');
}

// ── Base fetch wrapper ─────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; refresh_token: string; user: any }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<any>('/api/auth/me'),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  register: (data: any) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboard = {
  get: () => apiFetch<any>('/api/dashboard'),
};

// ── Conversations ──────────────────────────────────────────────
export const conversations = {
  list: (params?: { status?: string; channel?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch<any[]>(`/api/conversations${qs}`);
  },
  get: (id: string) => apiFetch<any>(`/api/conversations/${id}`),
  sendMessage: (id: string, content: string) =>
    apiFetch<any>(`/api/conversations/${id}/messages`, {
      method: 'POST', body: JSON.stringify({ content }),
    }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/api/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Contacts ──────────────────────────────────────────────────
export const contacts = {
  list: () => apiFetch<any[]>('/api/contacts'),
  get: (id: string) => apiFetch<any>(`/api/contacts/${id}`),
  create: (data: any) => apiFetch<any>('/api/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Agents ────────────────────────────────────────────────────
export const agents = {
  list: () => apiFetch<any[]>('/api/agents'),
  create: (data: any) => apiFetch<any>('/api/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/api/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/agents/${id}`, { method: 'DELETE' }),
};

// ── Tenant ────────────────────────────────────────────────────
export const tenant = {
  me: () => apiFetch<any>('/api/tenant/me'),
  update: (data: any) => apiFetch<any>('/api/tenant/me', { method: 'PATCH', body: JSON.stringify(data) }),
  integrations: () => apiFetch<any[]>('/api/tenant/integrations'),
  updateIntegration: (type: string, data: any) =>
    apiFetch<any>(`/api/tenant/integrations/${type}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Admin ─────────────────────────────────────────────────────
export const admin = {
  stats: () => apiFetch<any>('/api/admin/stats'),
  tenants: () => apiFetch<any[]>('/api/admin/tenants'),
  getTenant: (id: string) => apiFetch<any>(`/api/admin/tenants/${id}`),
  createTenant: (data: any) =>
    apiFetch<any>('/api/admin/tenants', { method: 'POST', body: JSON.stringify(data) }),
  updateTenant: (id: string, data: any) =>
    apiFetch<any>(`/api/admin/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  suspendTenant: (id: string) =>
    apiFetch(`/api/admin/tenants/${id}/suspend`, { method: 'POST' }),
  activateTenant: (id: string) =>
    apiFetch(`/api/admin/tenants/${id}/activate`, { method: 'POST' }),
  users: () => apiFetch<any[]>('/api/admin/users'),
  inviteUser: (data: any) =>
    apiFetch('/api/admin/users/invite', { method: 'POST', body: JSON.stringify(data) }),
  audit: () => apiFetch<any[]>('/api/admin/audit'),
};
