import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createErrorHandlerMiddleware,
  transformTRPCError,
  createTRPCErrorFormatter,
} from "./error-handler.middleware.js";
import {
  TaskNotFoundError,
  ValidationError,
  AiServiceError,
} from "../../domain/index.js";
import { createLogger } from "../logging/index.js";
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as Response;
}

function silentLogger() {
  return createLogger({ enabled: false });
}

// ---------------------------------------------------------------------------
// createErrorHandlerMiddleware
// ---------------------------------------------------------------------------

describe("createErrorHandlerMiddleware", () => {
  const logger = silentLogger();
  const handler = createErrorHandlerMiddleware(logger);
  let res: Response;

  beforeEach(() => {
    res = mockResponse();
  });

  it("maps domain NotFoundError to 404", () => {
    const err = new TaskNotFoundError("abc-123");

    handler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "TASK_NOT_FOUND" }),
      })
    );
  });

  it("maps domain ValidationError to 400", () => {
    const err = new ValidationError("Invalid input");

    handler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps AiServiceError to 503", () => {
    const err = new AiServiceError("Gemini down");

    handler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("wraps unknown errors as 500 INTERNAL_ERROR", () => {
    const err = new Error("something broke");

    handler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
      })
    );
  });

  it("includes requestId in response (null when no context)", () => {
    handler(new Error("x"), {} as Request, res, vi.fn() as NextFunction);

    const body = vi.mocked(res.json).mock.calls[0][0];
    expect(body).toHaveProperty("requestId");
  });
});

// ---------------------------------------------------------------------------
// transformTRPCError
// ---------------------------------------------------------------------------

describe("transformTRPCError", () => {
  it("returns existing TRPCError unchanged", () => {
    const original = new TRPCError({ code: "NOT_FOUND", message: "nope" });

    const result = transformTRPCError(original);

    expect(result).toBe(original);
  });

  it("maps TaskNotFoundError (404) to NOT_FOUND", () => {
    const err = new TaskNotFoundError("abc");

    const result = transformTRPCError(err);

    expect(result).toBeInstanceOf(TRPCError);
    expect(result.code).toBe("NOT_FOUND");
    expect(result.message).toContain("abc");
  });

  it("maps ValidationError (400) to BAD_REQUEST", () => {
    const result = transformTRPCError(new ValidationError("bad"));
    expect(result.code).toBe("BAD_REQUEST");
  });

  it("maps AiServiceError (503) to SERVICE_UNAVAILABLE", () => {
    const result = transformTRPCError(new AiServiceError("down"));
    expect(result.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("maps unknown errors to INTERNAL_SERVER_ERROR", () => {
    const result = transformTRPCError(new Error("boom"));
    expect(result.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("preserves original AppError as cause", () => {
    const err = new TaskNotFoundError("abc");
    const result = transformTRPCError(err);
    expect(result.cause).toBe(err);
  });
});

// ---------------------------------------------------------------------------
// createTRPCErrorFormatter
// ---------------------------------------------------------------------------

describe("createTRPCErrorFormatter", () => {
  const logger = silentLogger();
  const formatter = createTRPCErrorFormatter(logger);

  it("augments shape with appError and requestId", () => {
    const trpcErr = new TRPCError({
      code: "NOT_FOUND",
      message: "not found",
      cause: new TaskNotFoundError("abc"),
    });

    const result = formatter({
      error: trpcErr,
      shape: { data: {} },
    });

    expect(result.data).toHaveProperty("appError");
    expect((result.data as Record<string, unknown>).appError).toEqual(
      expect.objectContaining({ code: "TASK_NOT_FOUND" })
    );
    expect(result.data).toHaveProperty("requestId");
  });

  it("handles shape without data object", () => {
    const trpcErr = new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "x" });

    const result = formatter({ error: trpcErr, shape: { data: "string" } });

    expect(result.data).toHaveProperty("appError");
  });
});
