export type MemoryType = 'screenshot' | 'pdf' | 'link' | 'image' | 'note' | 'pptx' | 'presentation';

export interface Memory {
  id: string;
  user_id?: string;
  title: string;
  memory_type: MemoryType;
  content_snippet?: string;
  extracted_text?: string;
  summary?: string;
  source_url?: string;
  file_path?: string;
  preview_image_url?: string;
  is_favorite: boolean;
  created_at: string;
  tags?: string;
}

export interface SearchResultItem {
  memory: Memory;
  similarity_score: number;
  matched_snippet: string;
  why_matched: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
}

export interface KnowledgeNode {
  id: string;
  label: string;
  memory_type: string;
  cluster: string;
  val: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  value: number;
}

export interface KnowledgeGraphResponse {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface ActivityLog {
  id: string;
  action_type: string;
  title: string;
  target: string;
  created_at: string;
  time_ago?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  initials: string;
  created_at: string;
  memories_count: number;
  storage_formatted: string;
  is_cloud_db: boolean;
  db_provider: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}
