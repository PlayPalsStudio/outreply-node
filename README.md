# @outreply/node

Official Node.js & TypeScript SDK for the [OutReply Developer API](https://outreply.com/developers).

```bash
npm install @outreply/node
```

## Quick start

```ts
import OutReply from "@outreply/node";

const outreply = new OutReply(process.env.OUTREPLY_API_KEY!);

// 1. Verify your key works
const me = await outreply.account.retrieve();
console.log(`Signed in as ${me.email}`);

// 2. Schedule a post (idempotency-safe — retry to your heart's content)
const post = await outreply.posts.schedule({
  page_id: "65f...",
  message: "Launching tomorrow 🚀",
  scheduled_at: "2026-05-01T10:00:00Z",
});

// 2b. …or publish one right now.
const live = await outreply.posts.publish({
  page_id: "65f...",
  message: "We're live! 🎉",
  media_urls: ["https://cdn.example.com/hero.jpg"],
});
console.log(live.platform_post_id);

// 3. Subscribe to real-time events
const hook = await outreply.webhooks.create({
  url: "https://example.com/webhooks/outreply",
  events: ["post.published", "post.failed"],
});
console.log("Store this secret — it's shown only once:", hook.secret);
```

## Features

- 🔐 Bearer-token auth. Supports scoped keys and sandbox tokens.
- 🔁 Automatic `Idempotency-Key` on every mutating call.
- 🪝 Built-in webhook signature verifier (`@outreply/node/webhooks`).
- ⏱ Exponential-backoff retries that respect `Retry-After`.
- 🧯 Typed errors mapped 1:1 with the [error catalog](https://outreply.com/api/v1/errors).
- 📦 First-party TypeScript types. Zero runtime dependencies.

## Resources

| Namespace | Methods |
|-----------|---------|
| `outreply.account` | `retrieve()` |
| `outreply.brands` | `list()` |
| `outreply.pages` | `list({ brand_id?, platform? })` |
| `outreply.posts` | `schedule()`, `listScheduled()`, `retrieveScheduled()`, `cancelScheduled()`, `listPublished()` |
| `outreply.comments` | `list()`, `reply()` |
| `outreply.media` | `upload()`, `list()`, `retrieve()`, `delete()` |
| `outreply.webhooks` | `list()`, `retrieve()`, `create()`, `delete()` |

## Webhook verification

```ts
import express from "express";
import { constructEvent } from "@outreply/node/webhooks";

const app = express();

app.post(
  "/webhooks/outreply",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const event = constructEvent({
        payload: req.body, // raw Buffer — NOT express.json()
        header: req.header("X-OutReply-Signature"),
        secret: process.env.OUTREPLY_WEBHOOK_SECRET!,
        timestampHeader: req.header("X-OutReply-Timestamp"),
        toleranceSec: 300,
      });
      console.log("Received:", event.type, event.data);
      res.sendStatus(200);
    } catch {
      res.sendStatus(400);
    }
  }
);
```

The verifier is dual-signature aware — it accepts comma-separated signatures so your receiver keeps accepting traffic during a 24-hour secret-rotation grace window.

## Error handling

```ts
import {
  OutReply,
  OutReplyRateLimitError,
  OutReplyValidationError,
  OutReplyQuotaError,
} from "@outreply/node";

try {
  await outreply.posts.schedule({ /* ... */ });
} catch (err) {
  if (err instanceof OutReplyValidationError) {
    console.error("Bad input:", err.details);
  } else if (err instanceof OutReplyRateLimitError) {
    console.error(`Slow down — retry in ${err.retryAfterSec}s`);
  } else if (err instanceof OutReplyQuotaError) {
    console.error("Daily quota exceeded. Upgrade your plan.");
  } else {
    throw err;
  }
}
```

## Configuration

```ts
new OutReply({
  apiKey: process.env.OUTREPLY_API_KEY!,
  timeoutMs: 30_000,
  maxRetries: 2, // 3 attempts total
  defaultHeaders: { "X-Tenant": "acme-co" },
});
```

## License

MIT © OutReply
