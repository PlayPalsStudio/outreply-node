import { errorFromResponse, OutReplyConnectionError, OutReplyError } from "./errors.js";

export interface ClientOptions {
  /** API key — e.g. `outreply_live_...` or `outreply_test_...`. */
  apiKey: string;
  /** Defaults to https://api.outreply.com/api/v1 */
  baseUrl?: string;
  /** Per-call timeout in milliseconds. Defaults to 30_000. */
  timeoutMs?: number;
  /** Max number of retries for transient failures. Defaults to 2 (= 3 attempts). */
  maxRetries?: number;
  /** Additional headers sent on every request. */
  defaultHeaders?: Record<string, string>;
  /** Override fetch. Defaults to global fetch. */
  fetch?: typeof fetch;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /**
   * When provided, sent as `Idempotency-Key`. On mutating methods the SDK
   * auto-generates one if you don't set it.
   */
  idempotencyKey?: string | null;
  /** Extra per-call headers. */
  headers?: Record<string, string>;
  /** Expect multipart/form-data body — body must be a FormData. */
  multipart?: boolean;
}

const DEFAULT_BASE = "https://api.outreply.com/api/v1";
const MUTATING = new Set(["POST", "PATCH", "DELETE", "PUT"]);
const SDK_VERSION = "1.0.1";

function buildQuery(q?: RequestOptions["query"]): string {
  if (!q) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

function uuidv4(): string {
  // Small, dependency-free UUID v4.
  const rnd = new Uint8Array(16);
  if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
    (crypto as any).getRandomValues(rnd);
  } else {
    for (let i = 0; i < 16; i++) rnd[i] = Math.floor(Math.random() * 256);
  }
  rnd[6] = (rnd[6]! & 0x0f) | 0x40;
  rnd[8] = (rnd[8]! & 0x3f) | 0x80;
  const hex = Array.from(rnd, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly extraHeaders: Record<string, string>;
  private readonly _fetch: typeof fetch;

  constructor(opts: ClientOptions) {
    if (!opts.apiKey) throw new Error("OutReply SDK: apiKey is required.");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.maxRetries = Math.max(0, opts.maxRetries ?? 2);
    this.extraHeaders = opts.defaultHeaders ?? {};
    this._fetch = opts.fetch ?? (globalThis as any).fetch;
    if (!this._fetch) {
      throw new Error(
        "OutReply SDK: global fetch() is not available. Use Node 18+ or pass `fetch` in the client options."
      );
    }
  }

  async request<T = unknown>(opts: RequestOptions): Promise<T> {
    const method = opts.method ?? "GET";
    const url = `${this.baseUrl}${opts.path}${buildQuery(opts.query)}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "User-Agent": `outreply-node/${SDK_VERSION}`,
      ...this.extraHeaders,
      ...(opts.headers ?? {}),
    };

    let bodyInit: BodyInit | undefined;
    if (opts.body !== undefined && opts.body !== null) {
      if (opts.multipart) {
        bodyInit = opts.body as FormData;
      } else {
        headers["Content-Type"] = "application/json";
        bodyInit = JSON.stringify(opts.body);
      }
    }

    if (MUTATING.has(method)) {
      const key = opts.idempotencyKey === null ? undefined : (opts.idempotencyKey ?? uuidv4());
      if (key) headers["Idempotency-Key"] = key;
    }

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), this.timeoutMs);
      let res: Response;
      try {
        res = await this._fetch(url, {
          method,
          headers,
          body: bodyInit,
          signal: controller.signal,
        });
      } catch (e: any) {
        clearTimeout(t);
        if (attempt < this.maxRetries) {
          await sleep(this.backoff(attempt));
          attempt++;
          continue;
        }
        throw new OutReplyConnectionError(e?.message ?? String(e));
      }
      clearTimeout(t);

      if (res.status === 204) return undefined as unknown as T;

      const retryAfter = res.headers.get("retry-after");
      const retryAfterSec = retryAfter ? Number(retryAfter) : undefined;

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await res.json().catch(() => null) : null;

      if (res.ok) return (payload ?? (await res.text())) as T;

      // Retry transient failures
      const shouldRetry =
        attempt < this.maxRetries &&
        (res.status === 429 || res.status >= 500);
      if (shouldRetry) {
        const waitMs = retryAfterSec ? retryAfterSec * 1000 : this.backoff(attempt);
        await sleep(waitMs);
        attempt++;
        continue;
      }
      throw errorFromResponse(res.status, payload, retryAfterSec);
    }
  }

  private backoff(attempt: number): number {
    // 500ms, 1s, 2s, 4s ... with jitter
    const base = Math.min(500 * Math.pow(2, attempt), 8000);
    return base + Math.floor(Math.random() * 250);
  }
}
