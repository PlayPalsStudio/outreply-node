import type { HttpClient } from "../http.js";
import type { Paginated, PublishedPost, ScheduledPost } from "../types.js";

export interface SchedulePostParams {
  page_id: string;
  message: string;
  media_ids?: string[];
  scheduled_at: string; // ISO 8601
  link?: string;
  first_comment?: string;
}

export interface PublishPostParams {
  page_id: string;
  message?: string;
  media_ids?: string[];
  media_urls?: string[];
  first_comment?: string;
  tiktok_settings?: Record<string, unknown>;
}

export class PostsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Schedule a new post. An `Idempotency-Key` is attached automatically —
   * safe to retry.
   */
  schedule(params: SchedulePostParams, opts: { idempotencyKey?: string } = {}): Promise<ScheduledPost> {
    return this.http.request<ScheduledPost>({
      method: "POST",
      path: "/posts/schedule",
      body: params,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /**
   * Publish a post immediately. Blocks until the upstream platform
   * accepts the post — expect multi-second latency for large media.
   * An `Idempotency-Key` is attached automatically — safe to retry.
   */
  publish(params: PublishPostParams, opts: { idempotencyKey?: string } = {}): Promise<PublishedPost> {
    return this.http.request<PublishedPost>({
      method: "POST",
      path: "/posts/publish",
      body: params,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  listScheduled(params: { page_id?: string; cursor?: string; limit?: number } = {}): Promise<Paginated<ScheduledPost>> {
    return this.http.request<Paginated<ScheduledPost>>({
      method: "GET",
      path: "/posts/scheduled",
      query: params,
    });
  }

  retrieveScheduled(id: string): Promise<ScheduledPost> {
    return this.http.request<ScheduledPost>({
      method: "GET",
      path: `/posts/scheduled/${encodeURIComponent(id)}`,
    });
  }

  cancelScheduled(id: string): Promise<void> {
    return this.http.request<void>({
      method: "DELETE",
      path: `/posts/scheduled/${encodeURIComponent(id)}`,
    });
  }

  listPublished(params: { page_id?: string; cursor?: string; limit?: number } = {}): Promise<Paginated<ScheduledPost>> {
    return this.http.request<Paginated<ScheduledPost>>({
      method: "GET",
      path: "/posts/published",
      query: params,
    });
  }
}
