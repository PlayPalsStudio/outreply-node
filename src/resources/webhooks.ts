import type { HttpClient } from "../http.js";
import type { Paginated, Webhook, WebhookEvent } from "../types.js";

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<Paginated<Webhook>> {
    return this.http.request<Paginated<Webhook>>({ method: "GET", path: "/webhooks" });
  }

  retrieve(id: string): Promise<Webhook> {
    return this.http.request<Webhook>({ method: "GET", path: `/webhooks/${encodeURIComponent(id)}` });
  }

  /**
   * Subscribe to events. Returns the created webhook — the `secret` field is
   * shown only once; store it securely.
   */
  create(
    params: { url: string; events: WebhookEvent[] | string[] },
    opts: { idempotencyKey?: string } = {}
  ): Promise<Webhook & { secret: string }> {
    return this.http.request({
      method: "POST",
      path: "/webhooks",
      body: params,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  delete(id: string): Promise<void> {
    return this.http.request<void>({
      method: "DELETE",
      path: `/webhooks/${encodeURIComponent(id)}`,
    });
  }
}
