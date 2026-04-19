import { describe, expect, it } from "vitest";
import {
  verifyWebhookSignature,
  constructEvent,
} from "../src/webhooks";
import { createHmac } from "node:crypto";

const SECRET = "whsec_test_abc123";
const PAYLOAD = JSON.stringify({ id: "evt_1", type: "post.published", data: {} });
const SIG = createHmac("sha256", SECRET).update(PAYLOAD).digest("hex");

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature", () => {
    expect(
      verifyWebhookSignature({ payload: PAYLOAD, header: SIG, secret: SECRET })
    ).toBe(true);
  });

  it("accepts the `sha256=` prefix", () => {
    expect(
      verifyWebhookSignature({ payload: PAYLOAD, header: `sha256=${SIG}`, secret: SECRET })
    ).toBe(true);
  });

  it("accepts multi-signature headers (rotation grace window)", () => {
    const header = `deadbeef, sha256=${SIG}`;
    expect(verifyWebhookSignature({ payload: PAYLOAD, header, secret: SECRET })).toBe(true);
  });

  it("rejects a bad signature", () => {
    expect(
      verifyWebhookSignature({ payload: PAYLOAD, header: "bad", secret: SECRET })
    ).toBe(false);
  });

  it("rejects stale timestamps when tolerance is set", () => {
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    expect(
      verifyWebhookSignature({
        payload: PAYLOAD,
        header: SIG,
        secret: SECRET,
        timestampHeader: old,
        toleranceSec: 300,
      })
    ).toBe(false);
  });
});

describe("constructEvent", () => {
  it("returns the parsed event on success", () => {
    const event = constructEvent({ payload: PAYLOAD, header: SIG, secret: SECRET });
    expect(event.type).toBe("post.published");
  });

  it("throws on invalid signature", () => {
    expect(() =>
      constructEvent({ payload: PAYLOAD, header: "nope", secret: SECRET })
    ).toThrow();
  });
});
