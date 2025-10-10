// API client with JWT auth and error handling
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setAuthToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  private removeAuthToken() {
    localStorage.removeItem('access_token');
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { requiresAuth = true, ...fetchConfig } = config;
    
    const headers = new Headers(fetchConfig.headers);
    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchConfig,
      headers,
    });

    if (response.status === 401 && requiresAuth) {
      // Token expired, try to refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request(endpoint, config);
      }
      throw new Error('Autenticação necessária');
    }

    if (!response.ok) {
      let errorMessage = `Falha na requisição: ${response.status}`;
      
      try {
        const error = await response.json();
        console.error('API Error Response:', error);
        
        // Handle Pydantic validation errors (422)
        if (response.status === 422 && error.detail && Array.isArray(error.detail)) {
          const validationErrors = error.detail.map((err: any) => {
            const field = err.loc?.slice(1).join('.') || 'Campo';
            return `${field}: ${err.msg}`;
          }).join('; ');
          errorMessage = `Erro de Validação: ${validationErrors}`;
        }
        // Handle standard error response with detail field
        else if (error.detail) {
          errorMessage = typeof error.detail === 'string' 
            ? error.detail 
            : JSON.stringify(error.detail);
        }
        // Handle error with message field
        else if (error.message) {
          errorMessage = error.message;
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const { access_token } = await response.json();
        this.setAuthToken(access_token);
        return true;
      }
    } catch {
      this.removeAuthToken();
    }
    return false;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Falha no login' }));
      throw new Error(error.detail || 'Credenciais inválidas');
    }

    const data = await response.json();
    this.setAuthToken(data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  }

  logout() {
    this.removeAuthToken();
    localStorage.removeItem('refresh_token');
  }

  // File upload with presigned URL
  async uploadFile(file: File, path: string) {
    const { presigned_url, file_key } = await this.request<{ presigned_url: string; file_key: string }>(
      '/files/presigned-url',
      {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, path }),
      }
    );

    await fetch(presigned_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    await this.request('/files/confirm', {
      method: 'POST',
      body: JSON.stringify({ file_key }),
    });

    return file_key;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
