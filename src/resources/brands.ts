import type { HttpClient } from "../http.js";
import type { Brand, Paginated } from "../types.js";

export class BrandsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: { cursor?: string; limit?: number } = {}): Promise<Paginated<Brand>> {
    return this.http.request<Paginated<Brand>>({
      method: "GET",
      path: "/brands",
      query: params,
    });
  }
}
