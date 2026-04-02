// Common types shared across the application

export type Platform = 'instagram' | 'youtube' | 'twitter';

export type Sentiment = 'positive' | 'negative' | 'neutral';

export type Intent =
  | 'question'
  | 'complaint'
  | 'praise'
  | 'feedback'
  | 'spam'
  | 'other';

export type Urgency = 'spam' | 'low' | 'medium' | 'high' | 'critical';

export type Severity = 'low' | 'medium' | 'high';

export interface Source {
  id: number;
  url: string;
  platform: Platform;
  label: string;
  created_at: string;
  last_fetched_at: string | null;
}

export interface Comment {
  id: number;
  source_id: number;
  external_id: string;
  author: string;
  text: string;
  likes: number;
  published_at: string | null;
  fetched_at: string;
  sentiment: Sentiment | null;
  intent: Intent | null;
  urgency: Urgency | null;
  needs_attention: boolean;
  ai_reason: string | null;
  analyzed_at: string | null;
  // joined fields
  platform?: Platform;
  source_url?: string;
  source_label?: string;
}

export interface Alert {
  id: number;
  comment_id: number;
  source_id: number;
  reason: string;
  severity: Severity;
  created_at: string;
  resolved: boolean;
  // joined fields
  comment_text?: string;
  comment_author?: string;
  comment_likes?: number;
  source_url?: string;
  source_label?: string;
  platform?: Platform;
  sentiment?: Sentiment | null;
  intent?: Intent | null;
  urgency?: Urgency | null;
}

export interface AnalysisResult {
  sentiment: Sentiment;
  intent: Intent;
  urgency: Urgency;
  needs_attention: boolean;
  reason: string;
}

export interface RawComment {
  external_id: string;
  author: string;
  text: string;
  likes: number;
  published_at: string | null;
}

export interface StatsData {
  total: number;
  needs_attention: number;
  critical: number;
  unanalyzed: number;
  by_platform: Record<Platform, number>;
  by_sentiment: Record<Sentiment, number>;
  by_urgency: Record<Urgency, number>;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  pageSize: number;
}
