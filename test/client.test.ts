import { describe, expect, it, vi } from "vitest";
import OutReply, { OutReplyAuthError, OutReplyValidationError } from "../src/index";

function mockFetch(responses: Array<{ status: number; body: any; headers?: Record<string, string> }>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const r = responses.shift()!;
    return new Response(JSON.stringify(r.body), {
      status: r.status,
      headers: { "content-type": "application/json", ...(r.headers ?? {}) },
    });
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

describe("OutReply client", () => {
  it("sends bearer auth + idempotency on POSTs", async () => {
    const { fn, calls } = mockFetch([{ status: 200, body: { id: "p_1" } }]);
    const client = new OutReply({ apiKey: "outreply_test_x", fetch: fn, maxRetries: 0 });

    await client.posts.schedule({
      page_id: "page_1",
      message: "hi",
      publish_at: "2026-05-01T10:00:00Z",
    });

    expect(calls).toHaveLength(1);
    const h = calls[0]!.init!.headers as Record<string, string>;
    expect(h.Authorization).toBe("Bearer outreply_test_x");
    expect(h["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("maps 401 to OutReplyAuthError", async () => {
    const { fn } = mockFetch([
      { status: 401, body: { code: "INVALID_TOKEN", message: "bad key" } },
    ]);
    const client = new OutReply({ apiKey: "x", fetch: fn, maxRetries: 0 });
    await expect(client.account.retrieve()).rejects.toBeInstanceOf(OutReplyAuthError);
  });

  it("maps 422 to OutReplyValidationError", async () => {
    const { fn } = mockFetch([
      { status: 422, body: { code: "VALIDATION_ERROR", message: "bad", details: { field: "page_id" } } },
    ]);
    const client = new OutReply({ apiKey: "x", fetch: fn, maxRetries: 0 });
    await expect(
      client.posts.schedule({ page_id: "", message: "", publish_at: "" })
    ).rejects.toBeInstanceOf(OutReplyValidationError);
  });
});
