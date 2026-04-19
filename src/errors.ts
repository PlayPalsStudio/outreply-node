/**
 * Error classes — 1:1 with the OutReply API error catalog.
 * See: https://outreply.com/api/v1/errors
 */

export interface OutReplyErrorPayload {
  code: string;
  message: string;
  status: number;
  request_id?: string;
  details?: unknown;
}

export class OutReplyError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(payload: OutReplyErrorPayload) {
    super(payload.message);
    this.name = "OutReplyError";
    this.code = payload.code;
    this.status = payload.status;
    this.requestId = payload.request_id;
    this.details = payload.details;
  }
}

export class OutReplyAuthError extends OutReplyError {
  constructor(p: OutReplyErrorPayload) { super(p); this.name = "OutReplyAuthError"; }
}
export class OutReplyScopeError extends OutReplyError {
  constructor(p: OutReplyErrorPayload) { super(p); this.name = "OutReplyScopeError"; }
}
export class OutReplyRateLimitError extends OutReplyError {
  readonly retryAfterSec?: number;
  constructor(p: OutReplyErrorPayload, retryAfterSec?: number) {
    super(p);
    this.name = "OutReplyRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}
export class OutReplyQuotaError extends OutReplyError {
  constructor(p: OutReplyErrorPayload) { super(p); this.name = "OutReplyQuotaError"; }
}
export class OutReplyValidationError extends OutReplyError {
  constructor(p: OutReplyErrorPayload) { super(p); this.name = "OutReplyValidationError"; }
}
export class OutReplyIdempotencyError extends OutReplyError {
  constructor(p: OutReplyErrorPayload) { super(p); this.name = "OutReplyIdempotencyError"; }
}
export class OutReplyServerError extends OutReplyError {
  constructor(p: OutReplyErrorPayload) { super(p); this.name = "OutReplyServerError"; }
}
export class OutReplyConnectionError extends OutReplyError {
  constructor(message: string) {
    super({ code: "CONNECTION_ERROR", message, status: 0 });
    this.name = "OutReplyConnectionError";
  }
}

export function errorFromResponse(
  status: number,
  body: { code?: string; message?: string; request_id?: string; details?: unknown } | null,
  retryAfterSec?: number
): OutReplyError {
  const payload: OutReplyErrorPayload = {
    code: body?.code ?? "UNKNOWN_ERROR",
    message: body?.message ?? `HTTP ${status}`,
    status,
    request_id: body?.request_id,
    details: body?.details,
  };

  if (status === 401) return new OutReplyAuthError(payload);
  if (status === 403) return new OutReplyScopeError(payload);
  if (status === 409 && payload.code.startsWith("IDEMPOTENCY"))
    return new OutReplyIdempotencyError(payload);
  if (status === 422) return new OutReplyValidationError(payload);
  if (status === 429) {
    return payload.code === "QUOTA_EXCEEDED"
      ? new OutReplyQuotaError(payload)
      : new OutReplyRateLimitError(payload, retryAfterSec);
  }
  if (status >= 500) return new OutReplyServerError(payload);
  return new OutReplyError(payload);
}
