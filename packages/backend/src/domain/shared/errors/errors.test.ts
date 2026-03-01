import { describe, it, expect } from "vitest";
import {
  AppError,
  TaskNotFoundError,
  NoteNotFoundError,
  GoalNotFoundError,
  ValidationError,
  AiServiceError,
  AiRateLimitedError,
  DatabaseError,
  DatabaseConnectionError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
  wrapError,
} from "./index.js";

describe("AppError", () => {
  it("sets code, message, httpStatus, and timestamp", () => {
    const err = new AppError("VALIDATION_ERROR", "bad input", { field: "name" });

    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("bad input");
    expect(err.httpStatus).toBe(400);
    expect(err.details).toEqual({ field: "name" });
    expect(err.timestamp).toBeInstanceOf(Date);
    expect(err).toBeInstanceOf(Error);
  });

  it("toJSON includes code and message", () => {
    const err = new AppError("NOT_FOUND", "gone");
    const json = err.toJSON();

    expect(json.code).toBe("NOT_FOUND");
    expect(json.message).toBe("gone");
  });

  it("isAppError returns true for AppError instances", () => {
    expect(AppError.isAppError(new AppError("NOT_FOUND", "x"))).toBe(true);
    expect(AppError.isAppError(new TaskNotFoundError("1"))).toBe(true);
  });

  it("isAppError returns false for non-AppError", () => {
    expect(AppError.isAppError(new Error("plain"))).toBe(false);
    expect(AppError.isAppError("string")).toBe(false);
    expect(AppError.isAppError(null)).toBe(false);
  });
});

describe("Domain-specific errors", () => {
  it("TaskNotFoundError → 404", () => {
    const err = new TaskNotFoundError("abc");
    expect(err.httpStatus).toBe(404);
    expect(err.code).toBe("TASK_NOT_FOUND");
    expect(err.message).toContain("abc");
    expect(err.details).toEqual({ taskId: "abc" });
  });

  it("NoteNotFoundError → 404", () => {
    const err = new NoteNotFoundError("xyz");
    expect(err.httpStatus).toBe(404);
    expect(err.code).toBe("NOTE_NOT_FOUND");
  });

  it("GoalNotFoundError → 404", () => {
    const err = new GoalNotFoundError("g-1");
    expect(err.httpStatus).toBe(404);
    expect(err.code).toBe("GOAL_NOT_FOUND");
  });

  it("ValidationError → 400", () => {
    const err = new ValidationError("invalid", { field: "x" });
    expect(err.httpStatus).toBe(400);
  });

  it("AiServiceError → 503", () => {
    const err = new AiServiceError("API down");
    expect(err.httpStatus).toBe(503);
  });

  it("AiRateLimitedError → 429", () => {
    const err = new AiRateLimitedError(30);
    expect(err.httpStatus).toBe(429);
    expect(err.details).toEqual({ retryAfter: 30 });
  });

  it("DatabaseError → 500", () => {
    expect(new DatabaseError("fail").httpStatus).toBe(500);
  });

  it("DatabaseConnectionError → 503", () => {
    expect(new DatabaseConnectionError().httpStatus).toBe(503);
  });

  it("ConflictError → 409", () => {
    expect(new ConflictError("duplicate").httpStatus).toBe(409);
  });

  it("UnauthorizedError → 401", () => {
    expect(new UnauthorizedError().httpStatus).toBe(401);
  });

  it("ForbiddenError → 403", () => {
    expect(new ForbiddenError().httpStatus).toBe(403);
  });

  it("InternalError → 500", () => {
    expect(new InternalError().httpStatus).toBe(500);
  });
});

describe("wrapError", () => {
  it("returns AppError unchanged", () => {
    const err = new TaskNotFoundError("1");
    expect(wrapError(err)).toBe(err);
  });

  it("wraps plain Error as INTERNAL_ERROR", () => {
    const wrapped = wrapError(new Error("boom"));
    expect(wrapped.code).toBe("INTERNAL_ERROR");
    expect(wrapped.message).toBe("boom");
    expect(wrapped.httpStatus).toBe(500);
  });

  it("wraps non-Error values", () => {
    const wrapped = wrapError("string error");
    expect(wrapped.code).toBe("INTERNAL_ERROR");
    expect(wrapped.message).toBe("An unknown error occurred");
  });

  it("wraps null/undefined", () => {
    expect(wrapError(null).code).toBe("INTERNAL_ERROR");
    expect(wrapError(undefined).code).toBe("INTERNAL_ERROR");
  });
});
