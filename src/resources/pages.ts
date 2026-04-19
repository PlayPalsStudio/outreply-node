import type { HttpClient } from "../http.js";
import type { Page, Paginated } from "../types.js";

export class PagesResource {
  constructor(private readonly http: HttpClient) {}

  list(params: { brand_id?: string; platform?: string; cursor?: string; limit?: number } = {}): Promise<Paginated<Page>> {
    return this.http.request<Paginated<Page>>({
      method: "GET",
      path: "/pages",
      query: params,
    });
  }
}
