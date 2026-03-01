import type { Request } from "express";

export interface RequestContext {
  requestId: string;
  startTime: number;
  path: string;
  method: string;
}

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  enabled?: boolean;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}
