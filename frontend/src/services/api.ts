import axios from 'axios';
import {
  User,
  Token,
  GenerateRequest,
  GenerateResponse,
  Generation,
  BrandVoice,
  MessageResponse,
  ImproveRequest,
  ImproveResponse,
  ScheduledPost,
  ScheduledPostCreate,
  BrandVoiceExample,
  BrandVoiceExampleCreate,
  BrandVoiceAnalyzeRequest,
  BrandVoiceAnalyzeResponse,
  ChannelResult,
  HashtagsRequest,
  HashtagsResponse,
  SeriesRequest,
  SeriesResponse,
  ContentPlanRequest,
  ContentPlanResponse,
  AudienceAnalysisRequest,
  AudienceAnalysisResponse,
  ImageGenerateRequest,
  ImageGenerateResponse,
  ImageSettingsUpdate,
  ImageSettingsResponse,
} from '@/types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<Token> => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/me');
    return response.data;
  },
};

export const generateApi = {
  generate: async (data: GenerateRequest): Promise<GenerateResponse> => {
    const response = await api.post('/generate', data);
    return response.data;
  },

  getHistory: async (limit = 20, offset = 0): Promise<Generation[]> => {
    const response = await api.get('/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  saveGeneration: async (id: number): Promise<MessageResponse> => {
    const response = await api.post(`/history/${id}/save`);
    return response.data;
  },

  deleteGeneration: async (id: number): Promise<MessageResponse> => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },
};

export const adminApi = {
  getBrandVoice: async (): Promise<BrandVoice[]> => {
    const response = await api.get('/brandvoice');
    return response.data;
  },

  updateBrandVoice: async (data: {
    channel: string;
    content: string;
    examples?: string[];
  }): Promise<BrandVoice> => {
    const response = await api.put('/brandvoice', data);
    return response.data;
  },

  getBrandVoiceExamples: async (channel?: string): Promise<BrandVoiceExample[]> => {
    const response = await api.get('/brand-voice/examples', {
      params: channel ? { channel } : undefined,
    });
    return response.data;
  },

  createBrandVoiceExample: async (data: BrandVoiceExampleCreate): Promise<BrandVoiceExample> => {
    const response = await api.post('/brand-voice/examples', data);
    return response.data;
  },

  deleteBrandVoiceExample: async (id: number): Promise<MessageResponse> => {
    const response = await api.delete(`/brand-voice/examples/${id}`);
    return response.data;
  },

  analyzeBrandVoice: async (data: BrandVoiceAnalyzeRequest): Promise<BrandVoiceAnalyzeResponse> => {
    const response = await api.post('/brand-voice/analyze', data);
    return response.data;
  },
};

export const improveApi = {
  improve: async (action: string, data: ImproveRequest): Promise<ImproveResponse> => {
    const response = await api.post(`/improve/${action}`, data);
    return response.data;
  },
};

export const calendarApi = {
  getPosts: async (startDate?: string, endDate?: string, status?: string): Promise<ScheduledPost[]> => {
    const response = await api.get('/calendar', {
      params: { start_date: startDate, end_date: endDate, status },
    });
    return response.data;
  },

  createPost: async (data: ScheduledPostCreate): Promise<ScheduledPost> => {
    const response = await api.post('/calendar', data);
    return response.data;
  },

  updatePost: async (id: number, data: Partial<ScheduledPostCreate & { status: string }>): Promise<ScheduledPost> => {
    const response = await api.put(`/calendar/${id}`, data);
    return response.data;
  },

  deletePost: async (id: number): Promise<MessageResponse> => {
    const response = await api.delete(`/calendar/${id}`);
    return response.data;
  },
};

export const streamApi = {
  generateStream: async function* (
    data: GenerateRequest,
    token: string
  ): AsyncGenerator<{ channel: string; variants: ChannelResult[] }> {
    const response = await fetch(`${API_BASE}/generate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to start stream')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.channel && parsed.variants) {
              yield parsed
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }
  },
};

export const hashtagsApi = {
  generate: async (data: HashtagsRequest): Promise<HashtagsResponse> => {
    const response = await api.post('/hashtags/generate', data);
    return response.data;
  },
};

export const seriesApi = {
  generate: async (data: SeriesRequest): Promise<SeriesResponse> => {
    const response = await api.post('/series/generate', data);
    return response.data;
  },
};

export const contentPlanApi = {
  generate: async (data: ContentPlanRequest): Promise<ContentPlanResponse> => {
    const response = await api.post('/content-plan/generate', data);
    return response.data;
  },
};

export const audienceApi = {
  analyze: async (data: AudienceAnalysisRequest): Promise<AudienceAnalysisResponse> => {
    const response = await api.post('/audience/analyze', data);
    return response.data;
  },
};

export const mediaApi = {
  generateImage: async (data: ImageGenerateRequest): Promise<ImageGenerateResponse> => {
    const response = await api.post('/media/generate-image', data);
    return response.data;
  },
  
  getSettings: async (): Promise<ImageSettingsResponse> => {
    const response = await api.get('/image-settings');
    return response.data;
  },
  
  updateSettings: async (data: ImageSettingsUpdate): Promise<ImageSettingsResponse> => {
    const response = await api.put('/image-settings', data);
    return response.data;
  },
};

export default api;
