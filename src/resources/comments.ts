import type { HttpClient } from "../http.js";
import type { Comment, Paginated } from "../types.js";

export class CommentsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: { page_id?: string; post_id?: string; cursor?: string; limit?: number } = {}): Promise<Paginated<Comment>> {
    return this.http.request<Paginated<Comment>>({
      method: "GET",
      path: "/comments",
      query: params,
    });
  }

  reply(
    params: { comment_id: string; message: string },
    opts: { idempotencyKey?: string } = {}
  ): Promise<{ id: string; message: string; created_at: string }> {
    return this.http.request({
      method: "POST",
      path: "/comments/reply",
      body: params,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
