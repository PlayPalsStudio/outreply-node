/**
 * Webhook signature verification — zero-dependency HMAC-SHA256.
 * Accepts multi-signature headers (comma-separated) emitted during a secret
 * rotation's 24-hour grace window.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyOptions {
  /** The raw request body (string or Buffer — must NOT be re-parsed JSON). */
  payload: string | Buffer;
  /** Value of the `X-OutReply-Signature` header (may be comma-separated). */
  header: string | null | undefined;
  /** The secret issued when you created / rotated the webhook. */
  secret: string;
  /**
   * Optional — the tolerance (in seconds) around `X-OutReply-Timestamp` for
   * replay protection. Defaults to 5 minutes.
   */
  toleranceSec?: number;
  /** Required when `toleranceSec` is set. */
  timestampHeader?: string | null;
}

export interface WebhookPayload {
  id: string;
  type: string;
  created_at: string;
  data: unknown;
}

function hmac(secret: string, payload: string | Buffer): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Returns `true` when the signature matches, otherwise `false`.
 * Never throws — you decide whether to reject.
 */
export function verifyWebhookSignature(opts: VerifyOptions): boolean {
  if (!opts.header || !opts.secret) return false;

  if (opts.toleranceSec !== undefined) {
    if (!opts.timestampHeader) return false;
    const ts = Number(opts.timestampHeader);
    if (!Number.isFinite(ts)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - ts) > opts.toleranceSec) return false;
  }

  const expected = hmac(opts.secret, opts.payload);
  const candidates = opts.header.split(",").map((s) => s.trim()).filter(Boolean);
  for (const c of candidates) {
    const hex = c.startsWith("sha256=") ? c.slice(7) : c;
    if (safeEqualHex(hex, expected)) return true;
  }
  return false;
}

/**
 * Verify and parse a webhook payload in one call. Throws on failure.
 */
export function constructEvent(opts: VerifyOptions): WebhookPayload {
  if (!verifyWebhookSignature(opts)) {
    throw new Error("OutReply webhook signature verification failed.");
  }
  const str = typeof opts.payload === "string" ? opts.payload : opts.payload.toString("utf8");
  return JSON.parse(str) as WebhookPayload;
}
