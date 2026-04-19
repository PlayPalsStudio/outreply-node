import type { HttpClient } from "../http.js";
import type { Account } from "../types.js";

export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  /** Return the authenticated account — useful to verify the API key is valid. */
  retrieve(): Promise<Account> {
    return this.http.request<Account>({ method: "GET", path: "/account" });
  }
}
