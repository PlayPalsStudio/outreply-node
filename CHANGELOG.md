# Changelog

All notable changes to `@outreply/node` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-04-19

### Added
- `posts.publish(params)` — publish a post **immediately** (no scheduling). Synchronous with upstream platform; resolves once the platform accepts the post. Body is the same shape as `posts.schedule` minus `scheduled_at`, plus `media_urls`, `first_comment`, and `tiktok_settings`.
- New exported type `PublishedPost` describing the response.

## [1.0.1] — 2026-04-19

### Fixed
- **Breaking field rename**: `posts.schedule({ publish_at })` is now `posts.schedule({ scheduled_at })` to match the server contract. Calls made with 1.0.0 failed with `MISSING_FIELD: scheduled_at is required`. The `ScheduledPost` response type now exposes `scheduled_at` as well. If you upgraded on day one, update your call sites before shipping.

## [1.0.0] — 2026-04-19

### Added
- Initial release.
- `OutReply` client with resources `.account`, `.brands`, `.pages`, `.posts`, `.comments`, `.media`, `.webhooks`.
- Automatic `Idempotency-Key` (UUIDv4) on POST / PATCH / PUT / DELETE — opt out with `idempotencyKey: null`.
- Exponential-backoff retries that respect `Retry-After`.
- Typed error classes: `OutReplyAuthError`, `OutReplyScopeError`, `OutReplyRateLimitError`, `OutReplyQuotaError`, `OutReplyValidationError`, `OutReplyIdempotencyError`, `OutReplyServerError`, `OutReplyConnectionError`.
- `@outreply/node/webhooks` — zero-dep HMAC-SHA256 verifier with multi-signature support for 24h secret-rotation grace windows.
- Zero runtime dependencies. Requires Node 18+.
