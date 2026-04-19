/**
 * Minimal shared types.
 *
 * For full OpenAPI-derived types run:
 *   npx openapi-typescript https://api.outreply.com/api/v1/openapi.json -o src/openapi.d.ts
 * and import them alongside these ergonomic wrappers.
 */

export interface Paginated<T> {
  data: T[];
  cursor?: string | null;
  has_more?: boolean;
}

export interface Account {
  id: string;
  email: string;
  full_name?: string;
  credits?: number;
  plan?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  role?: string;
}

export interface Page {
  id: string;
  brand_id: string;
  platform: "instagram" | "facebook" | "linkedin" | "tiktok" | "twitter" | "youtube" | string;
  name: string;
  external_id?: string;
  avatar_url?: string;
}

export interface ScheduledPost {
  id: string;
  page_id: string;
  message: string;
  media_ids?: string[];
  scheduled_at: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  external_post_id?: string;
  error?: string | null;
}

export interface Comment {
  id: string;
  page_id: string;
  post_id?: string;
  author_name?: string;
  author_id?: string;
  message: string;
  created_at: string;
  sentiment?: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  duration_sec?: number;
}

export type WebhookEvent =
  | "post.published"
  | "post.failed"
  | "comment.received"
  | "comment.replied"
  | "account.quota.warning";

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  created_at: string;
}
