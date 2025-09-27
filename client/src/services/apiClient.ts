/**
 * Cathcr API Client Service
 * Centralized API communication for all endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

interface ApiResponse<T = any> {
  success?: boolean;
  status: string;
  message?: string;
  data?: T;
  error?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.authToken) {
      requestHeaders.Authorization = `Bearer ${this.authToken}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Health & Testing
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  async getApiTest(): Promise<ApiResponse> {
    return this.request('/api/test');
  }

  // Authentication endpoints
  async register(data: { username: string; email: string; password: string }): Promise<ApiResponse> {
    return this.request('/api/auth/register', { method: 'POST', body: data });
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse> {
    return this.request('/api/auth/login', { method: 'POST', body: data });
  }

  async refreshToken(token: string): Promise<ApiResponse> {
    return this.request('/api/auth/refresh', { method: 'POST', body: { token } });
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request('/api/auth/me');
  }

  // Capture endpoints
  async createCapture(data: {
    content?: string;
    transcribed_text?: string;
    audio_url?: string;
    audio_path?: string;
    audio_duration?: number;
    type?: string;
    category?: any;
    tags?: string[];
  }): Promise<ApiResponse> {
    return this.request('/api/capture', { method: 'POST', body: data });
  }

  async getCaptures(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    type?: string;
    search?: string;
    include_processed?: boolean;
  }): Promise<ApiResponse> {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return this.request(`/api/capture${query}`);
  }

  async getCaptureById(id: string): Promise<ApiResponse> {
    return this.request(`/api/capture/${id}`);
  }

  async updateCapture(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/api/capture/${id}`, { method: 'PUT', body: data });
  }

  async deleteCapture(id: string): Promise<ApiResponse> {
    return this.request(`/api/capture/${id}`, { method: 'DELETE' });
  }

  async transcribeAudio(data: { audio_data: string; content_type?: string }): Promise<ApiResponse> {
    return this.request('/api/capture/transcribe', { method: 'POST', body: data });
  }

  async syncCaptures(captures: any[]): Promise<ApiResponse> {
    return this.request('/api/capture/sync', { method: 'POST', body: { captures } });
  }

  async getQueueStatus(): Promise<ApiResponse> {
    return this.request('/api/capture/queue/status');
  }

  // Transcription endpoints
  async transcribeAudioFile(audioData: string): Promise<ApiResponse> {
    return this.request('/api/transcription/audio', { method: 'POST', body: { audio_data: audioData } });
  }

  async batchTranscribe(audioFiles: string[]): Promise<ApiResponse> {
    return this.request('/api/transcription/batch', { method: 'POST', body: { files: audioFiles } });
  }

  // Rooms endpoints
  async getRooms(): Promise<ApiResponse> {
    return this.request('/api/rooms');
  }

  async createRoom(data: { name: string; creatorId: string }): Promise<ApiResponse> {
    return this.request('/api/rooms', { method: 'POST', body: data });
  }

  async getRoomById(roomId: string): Promise<ApiResponse> {
    return this.request(`/api/rooms/${roomId}`);
  }

  async getRoomMessages(roomId: string, limit?: number): Promise<ApiResponse> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/api/rooms/${roomId}/messages${query}`);
  }
}

// Create and export a default instance
export const apiClient = new ApiClient();
export default apiClient;