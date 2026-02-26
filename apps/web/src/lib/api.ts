const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.whatsflow.tech') + '/api';

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

class ApiClient {
  private token: string | null = null;
  private storageKey = 'accessToken';

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(this.storageKey);
    }
    return this.token;
  }

  private async parseError(res: Response): Promise<string> {
    try {
      const data = (await res.json()) as ApiErrorPayload;

      if (Array.isArray(data?.message)) return data.message.join(' | ');
      if (typeof data?.message === 'string') return data.message;
      if (typeof data?.error === 'string') return data.error;
    } catch {
      // ignore
    }
    return `HTTP ${res.status} ${res.statusText}`;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    // Set JSON content-type only when sending a body and not already set
    if (!headers['Content-Type'] && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include', // IMPORTANT
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      // On stoppe ici avec un message clair
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const msg = await this.parseError(res);
      throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  // Auth
  async login(email: string, password: string) {
    const result = await this.request<{ accessToken: string; user: unknown }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    );

    // IMPORTANT: store token
    if (result?.accessToken) this.setToken(result.accessToken);

    return result;
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
    return this.request<{ data: unknown[]; meta: unknown }>(
      `/conversations/${conversationId}/messages?page=${page}`,
    );
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
    return this.request<unknown>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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