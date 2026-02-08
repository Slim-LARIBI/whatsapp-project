const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ accessToken: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getProfile() {
    return this.request<unknown>('/auth/me');
  }

  // Conversations
  getConversations(params?: { page?: number; status?: string; assignedTo?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.status) query.set('status', params.status);
    if (params?.assignedTo) query.set('assignedTo', params.assignedTo);
    return this.request<{ data: unknown[]; meta: unknown }>(`/conversations?${query}`);
  }

  getConversation(id: string) {
    return this.request<unknown>(`/conversations/${id}`);
  }

  getMessages(conversationId: string, page = 1) {
    return this.request<{ data: unknown[]; meta: unknown }>(`/conversations/${conversationId}/messages?page=${page}`);
  }

  sendMessage(conversationId: string, body: string) {
    return this.request<unknown>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  assignConversation(id: string, userId: string) {
    return this.request<unknown>(`/conversations/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    });
  }

  updateConversationStatus(id: string, status: string) {
    return this.request<unknown>(`/conversations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Contacts
  getContacts(params?: { page?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    return this.request<{ data: unknown[]; meta: unknown }>(`/contacts?${query}`);
  }

  getContact(id: string) {
    return this.request<unknown>(`/contacts/${id}`);
  }

  createContact(data: Record<string, unknown>) {
    return this.request<unknown>('/contacts', { method: 'POST', body: JSON.stringify(data) });
  }

  // Templates
  getTemplates(params?: { status?: string; category?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    return this.request<unknown[]>(`/templates?${query}`);
  }
}

export const api = new ApiClient();
