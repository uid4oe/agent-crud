/**
 * Request Logger Middleware
 *
 * Logs incoming requests and outgoing responses with:
 * - Request ID for correlation
 * - Method and path
 * - Response status code
 * - Request duration
 */

import { Request, Response, NextFunction } from "express";
import { Logger } from "../logging/index.js";
import {
  createRequestContext,
  runWithContext,
  getElapsedTime,
} from "./request-context.js";

export function createRequestLoggerMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const existingRequestId = req.headers["x-request-id"] as string | undefined;
    const context = createRequestContext(
      req.path,
      req.method,
      existingRequestId
    );

    // Set request ID header for downstream services
    res.setHeader("x-request-id", context.requestId);

    const requestLogger = logger.child({ requestId: context.requestId });

    // Log incoming request
    requestLogger.info("Request started", {
      method: context.method,
      path: context.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.socket.remoteAddress,
    });

    // Capture response finish
    res.on("finish", () => {
      const duration = getElapsedTime();
      const level = res.statusCode >= 400 ? "warn" : "info";

      requestLogger[level]("Request completed", {
        method: context.method,
        path: context.path,
        status: res.statusCode,
        duration,
      });
    });

    // Run the rest of the middleware chain with context
    runWithContext(context, () => {
      next();
    });
  };
}
