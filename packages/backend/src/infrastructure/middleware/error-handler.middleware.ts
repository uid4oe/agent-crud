/**
 * Error Handler Middleware
 *
 * Centralized error handling that:
 * - Catches all errors
 * - Maps domain errors to HTTP responses
 * - Logs errors appropriately
 * - Returns consistent error format
 */

import type { Request, Response, NextFunction } from "express";
import { TRPCError } from "@trpc/server";
import { AppError, wrapError } from "../../domain/index.js";
import type { Logger } from "../logging/index.js";
import { getRequestId } from "./request-context.js";

export function createErrorHandlerMiddleware(logger: Logger) {
  return (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    const requestId = getRequestId();
    const requestLogger = requestId
      ? logger.child({ requestId })
      : logger;

    // Convert to AppError if needed
    const appError = AppError.isAppError(err) ? err : wrapError(err);

    // Log error with appropriate level
    if (appError.httpStatus >= 500) {
      requestLogger.error("Server error occurred", err, {
        code: appError.code,
        details: appError.details,
      });
    } else {
      requestLogger.warn("Client error occurred", {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      });
    }

    // Send response
    res.status(appError.httpStatus).json({
      error: appError.toJSON(),
      requestId,
    });
  };
}

/**
 * tRPC Error transformer
 * Converts AppErrors to TRPCErrors for proper tRPC error handling
 */
export function transformTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  const appError = AppError.isAppError(error) ? error : wrapError(error);

  const codeMap: Record<number, TRPCError["code"]> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
  };

  const trpcCode = codeMap[appError.httpStatus] || "INTERNAL_SERVER_ERROR";

  return new TRPCError({
    code: trpcCode,
    message: appError.message,
    cause: appError,
  });
}

/**
 * Create tRPC error formatter
 */
export function createTRPCErrorFormatter(logger: Logger) {
  return ({ error, shape }: { error: TRPCError; shape: Record<string, unknown> }) => {
    const requestId = getRequestId();
    const requestLogger = requestId ? logger.child({ requestId }) : logger;

    // Extract AppError if it's the cause
    const appError =
      error.cause instanceof AppError
        ? error.cause
        : wrapError(error.cause || error);

    // Log based on error type
    if (appError.httpStatus >= 500) {
      requestLogger.error("tRPC server error", error, {
        code: appError.code,
        trpcCode: error.code,
      });
    } else {
      requestLogger.warn("tRPC client error", {
        code: appError.code,
        trpcCode: error.code,
        message: error.message,
      });
    }

    const shapeData = typeof shape.data === "object" && shape.data !== null
      ? shape.data as Record<string, unknown>
      : {};

    return {
      ...shape,
      data: {
        ...shapeData,
        appError: appError.toJSON(),
        requestId,
      },
    };
  };
}
