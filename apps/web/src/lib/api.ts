const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.whatsflow.tech';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    tenantId?: string;
  };
};

class ApiClient {
  private getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private setToken(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  }

  private clearToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    auth = true,
  ): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (auth) {
      const token = this.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        message = data?.message || data?.error || message;
      } catch {
        // ignore json parse errors
      }
      throw new Error(message);
    }

    return res.json();
  }

  // -------------------------
  // AUTH
  // -------------------------
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    );

    if (data?.accessToken) {
      this.setToken(data.accessToken);
    }

    return data;
  }

  async me() {
    return this.request('/api/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // -------------------------
  // CONVERSATIONS
  // -------------------------
  async getConversations() {
    return this.request<{
      data: any[];
      meta?: { page: number; limit: number; total: number };
    }>('/api/conversations');
  }

  async getConversation(id: string) {
    return this.request<any>(`/api/conversations/${id}`);
  }

  async getConversationMessages(id: string) {
    return this.request<{
      data: any[];
      meta?: { page: number; limit: number; total: number };
    }>(`/api/conversations/${id}/messages`);
  }

  async sendConversationMessage(
    id: string,
    payload: { body: string; replyToMessageId?: string },
  ) {
    return this.request<any>(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateConversationStatus(id: string, status: string) {
    return this.request<any>(`/api/conversations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async assignConversation(id: string, userId: string) {
    return this.request<any>(`/api/conversations/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    });
  }
}

export const api = new ApiClient();