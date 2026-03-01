import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter, RateLimitPresets } from "./rate-limiter.middleware.js";
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockReq(ip = "127.0.0.1", headers: Record<string, string> = {}): Request {
  return { ip, headers, socket: { remoteAddress: ip } } as Request;
}

function mockRes(): Response & { _headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  return {
    _headers: headers,
    setHeader: vi.fn((k: string, v: string) => {
      headers[k] = v;
    }),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as Response & { _headers: Record<string, string> };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  afterEach(() => {
    limiter?.destroy();
  });

  it("allows requests under the limit", () => {
    limiter = new RateLimiter({ windowMs: 60000, maxRequests: 3 });
    const mw = limiter.middleware();
    const next = vi.fn();
    const req = mockReq();

    mw(req, mockRes(), next);
    mw(req, mockRes(), next);
    mw(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(3);
  });

  it("blocks requests over the limit with 429", () => {
    limiter = new RateLimiter({ windowMs: 60000, maxRequests: 2 });
    const mw = limiter.middleware();
    const next = vi.fn();
    const req = mockReq();

    mw(req, mockRes(), next); // 1
    mw(req, mockRes(), next); // 2

    const res = mockRes();
    mw(req, res, next); // 3 — should be blocked

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "RATE_LIMITED" }),
      })
    );
  });

  it("sets rate limit headers", () => {
    limiter = new RateLimiter({ windowMs: 60000, maxRequests: 5 });
    const mw = limiter.middleware();
    const res = mockRes();

    mw(mockReq(), res, vi.fn());

    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "5");
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "4");
    expect(res.setHeader).toHaveBeenCalledWith(
      "X-RateLimit-Reset",
      expect.any(String)
    );
  });

  it("sets Retry-After header on 429", () => {
    limiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
    const mw = limiter.middleware();
    const req = mockReq();

    mw(req, mockRes(), vi.fn()); // fills quota

    const res = mockRes();
    mw(req, res, vi.fn()); // blocked

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("tracks different IPs independently", () => {
    limiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
    const mw = limiter.middleware();
    const next = vi.fn();

    mw(mockReq("10.0.0.1"), mockRes(), next);
    mw(mockReq("10.0.0.2"), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("uses X-Forwarded-For when present", () => {
    limiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
    const mw = limiter.middleware();
    const next = vi.fn();

    const req1 = mockReq("127.0.0.1", { "x-forwarded-for": "1.2.3.4" });
    const req2 = mockReq("127.0.0.1", { "x-forwarded-for": "1.2.3.4" });

    mw(req1, mockRes(), next); // allowed
    mw(req2, mockRes(), next); // blocked (same forwarded IP)

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("respects skip function", () => {
    limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      skip: (req) => req.ip === "10.0.0.99",
    });
    const mw = limiter.middleware();
    const next = vi.fn();

    mw(mockReq("10.0.0.99"), mockRes(), next);
    mw(mockReq("10.0.0.99"), mockRes(), next);
    mw(mockReq("10.0.0.99"), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(3); // all skipped
  });

  it("respects custom keyGenerator", () => {
    limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      keyGenerator: () => "shared-key",
    });
    const mw = limiter.middleware();
    const next = vi.fn();

    mw(mockReq("10.0.0.1"), mockRes(), next);
    mw(mockReq("10.0.0.2"), mockRes(), next); // different IP, same key

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("uses custom message on 429", () => {
    limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      message: "Slow down!",
    });
    const mw = limiter.middleware();
    const req = mockReq();

    mw(req, mockRes(), vi.fn());
    const res = mockRes();
    mw(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: "Slow down!" }),
      })
    );
  });
});

describe("RateLimitPresets", () => {
  it("standard preset has 100 requests per minute", () => {
    const config = RateLimitPresets.standard();
    expect(config.maxRequests).toBe(100);
    expect(config.windowMs).toBe(60000);
  });

  it("ai preset has 10 requests per minute with custom message", () => {
    const config = RateLimitPresets.ai();
    expect(config.maxRequests).toBe(10);
    expect(config.message).toContain("AI");
  });
});
