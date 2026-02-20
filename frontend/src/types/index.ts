export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export type Goal = 'продажа' | 'узнаваемость' | 'вовлечение' | 'анонс';
export type Tone = 'формальный' | 'дружелюбный' | 'дерзкий' | 'экспертный';
export type PostFormat = 'short' | 'longread' | 'case_study' | 'story';

export interface GenerateRequest {
  description: string;
  channels: string[];
  num_variants: number;
  goal: Goal;
  tone?: Tone;
  audience?: string;
  offer?: string;
  format?: PostFormat;
}

export interface ChannelResult {
  headline?: string;
  body: string;
  cta?: string;
  hashtags?: string[];
  image_prompt?: string;
  image_url?: string;
  score: number;
  improvements?: string[];
}

export interface GenerateResponse {
  results: Record<string, ChannelResult[]>;
  generation_id: number | null;
}

export interface Generation {
  id: number;
  description: string;
  channels: string[];
  variants: Record<string, ChannelResult[]>;
  num_variants: number;
  is_saved: boolean;
  created_at: string;
}

export interface BrandVoice {
  id: number;
  channel: string;
  content: string;
  examples: string[] | null;
  updated_at: string;
}

export interface MessageResponse {
  message: string;
}

export type Channel = 'Директ' | 'Telegram' | 'Email' | 'VK' | 'Дзен';

export const CHANNELS: Channel[] = ['Директ', 'Telegram', 'Email', 'VK', 'Дзен'];

export const CHANNEL_INFO: Record<Channel, { icon: string; description: string; color: string; gradient: string }> = {
  'Директ': {
    icon: '🎯',
    description: 'Заголовок до 35 знаков, текст до 81 знака',
    color: '#F59E0B',
    gradient: 'from-yellow-400 to-orange-500',
  },
  'Telegram': {
    icon: '📱',
    description: 'До 800 знаков, живой стиль с эмодзи',
    color: '#0088CC',
    gradient: 'from-[#0088cc] to-[#00b4d8]',
  },
  'Email': {
    icon: '📧',
    description: 'Тема до 50 знаков, интригующая',
    color: '#6B7280',
    gradient: 'from-slate-500 to-slate-700',
  },
  'VK': {
    icon: '💬',
    description: 'До 500 знаков, вовлекающий',
    color: '#4A76A8',
    gradient: 'from-[#4a76a8] to-[#5d8bb3]',
  },
  'Дзен': {
    icon: '📰',
    description: 'Лонгрид с заголовком и картинкой',
    color: '#FF6B35',
    gradient: 'from-orange-500 to-red-500',
  },
};

export const FORMATS: { value: PostFormat; label: string; icon: string; description: string }[] = [
  { value: 'short', label: 'Короткий пост', icon: '📝', description: 'Лаконичный, до 200 слов' },
  { value: 'longread', label: 'Лонгрид', icon: '📚', description: 'Развёрнутый материал, 500-1000 слов' },
  { value: 'case_study', label: 'Кейс', icon: '💼', description: 'История успеха с результатами' },
  { value: 'story', label: 'История', icon: '📖', description: 'Сторителлинг с эмоциями' },
];

export const GOALS: { value: Goal; label: string; icon: string; description: string }[] = [
  { value: 'продажа', label: 'Продажа', icon: '🛒', description: 'Привести к покупке, записи, заказу' },
  { value: 'узнаваемость', label: 'Узнаваемость', icon: '👁', description: 'Рассказать о бренде, продукте' },
  { value: 'вовлечение', label: 'Вовлечение', icon: '💬', description: 'Получить комментарии, реакции' },
  { value: 'анонс', label: 'Анонс', icon: '📢', description: 'Объявить о событии, новинке' },
];

export const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'дружелюбный', label: 'Дружелюбный', description: 'Тёплый, как разговор с приятелем' },
  { value: 'формальный', label: 'Формальный', description: 'Профессиональный, деловой' },
  { value: 'дерзкий', label: 'Дерзкий', description: 'Смелый, провокационный' },
  { value: 'экспертный', label: 'Экспертный', description: 'Авторитетный, со фактами' },
];

export type ImproveAction = 'shorten' | 'emoji' | 'tone' | 'cta';

export interface ImproveRequest {
  text: string;
  channel: string;
  action: ImproveAction;
  target_tone?: string;
}

export interface ImproveResponse {
  original_text: string;
  improved_text: string;
  action: string;
}

export interface ScheduledPost {
  id: number;
  channel: string;
  content: Record<string, unknown>;
  scheduled_date: string;
  timezone: string;
  status: 'draft' | 'scheduled' | 'published' | 'cancelled';
  created_at: string;
}

export interface ScheduledPostCreate {
  generation_id?: number;
  channel: string;
  content: Record<string, unknown>;
  scheduled_date: string;
  timezone: string;
}

export interface BrandVoiceExample {
  id: number;
  channel: string;
  original_text: string;
  created_at: string;
}

export interface BrandVoiceExampleCreate {
  channel: string;
  original_text: string;
}

export interface BrandVoiceAnalyzeRequest {
  channel: string;
  example_ids?: number[];
}

export interface BrandVoiceAnalyzeResponse {
  channel: string;
  generated_guideline: string;
  examples_count: number;
}

export interface HashtagsRequest {
  text: string;
  channel: string;
  count?: number;
}

export interface HashtagsResponse {
  hashtags: string[];
  selling_hashtags: string[];
}

export interface SeriesRequest {
  topic: string;
  channel: string;
  count: number;
  goal?: Goal;
  tone?: Tone;
}

export interface SeriesResponse {
  topic: string;
  posts: ChannelResult[];
}

export interface ContentPlanRequest {
  product: string;
  duration_days: number;
  channels: string[];
  goal?: Goal;
}

export interface ContentPlanItem {
  day: number;
  date: string;
  topic: string;
  channel: string;
  draft: ChannelResult;
}

export interface ContentPlanResponse {
  plan: ContentPlanItem[];
}

export interface AudienceAnalysisRequest {
  product: string;
  description?: string;
}

export interface AudienceAnalysisResponse {
  age_range: string;
  gender: string;
  interests: string[];
  pains: string[];
  triggers: string[];
  channels: string[];
  content_preferences: string[];
}

export interface ImageGenerateRequest {
  prompt: string;
  channel: string;
}

export interface ImageGenerateResponse {
  image_url: string;
  prompt: string;
}

export interface ImageSettingsUpdate {
  api_key?: string;
  model?: string;
  enabled?: boolean;
}

export interface ImageSettingsResponse {
  id: number;
  api_key: string | null;
  model: string;
  enabled: boolean;
  updated_at: string;
}
