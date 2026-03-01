import { Request, Response, NextFunction } from "express";
import type { RateLimiterConfig, RateLimitEntry } from "./types.js";

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly config: RateLimiterConfig) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Check if should skip
      if (this.config.skip?.(req)) {
        return next();
      }

      const key = this.config.keyGenerator
        ? this.config.keyGenerator(req)
        : this.getDefaultKey(req);

      const now = Date.now();
      const entry = this.store.get(key);

      // Initialize or reset if window expired
      if (!entry || now > entry.resetTime) {
        this.store.set(key, {
          count: 1,
          resetTime: now + this.config.windowMs,
        });
        this.setRateLimitHeaders(res, this.config.maxRequests - 1, now + this.config.windowMs);
        return next();
      }

      // Check if limit exceeded
      if (entry.count >= this.config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        res.setHeader("Retry-After", retryAfter.toString());
        this.setRateLimitHeaders(res, 0, entry.resetTime);
        res.status(429).json({
          error: {
            code: "RATE_LIMITED",
            message: this.config.message || "Too many requests, please try again later",
            retryAfter,
          },
        });
        return;
      }

      // Increment count
      entry.count++;
      this.setRateLimitHeaders(res, this.config.maxRequests - entry.count, entry.resetTime);
      next();
    };
  }

  private getDefaultKey(req: Request): string {
    // Use X-Forwarded-For if behind proxy, otherwise use socket address
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  }

  private setRateLimitHeaders(res: Response, remaining: number, resetTime: number): void {
    res.setHeader("X-RateLimit-Limit", this.config.maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining).toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const RateLimitPresets = {
  standard: (): RateLimiterConfig => ({
    windowMs: 60000,
    maxRequests: 100,
  }),
  ai: (): RateLimiterConfig => ({
    windowMs: 60000,
    maxRequests: 10,
    message: "AI rate limit exceeded. Please wait before sending more messages.",
  }),
};
