import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import type { RequestContext } from "./types.js";

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function createRequestContext(
  path: string,
  method: string,
  existingRequestId?: string
): RequestContext {
  return {
    requestId: existingRequestId || randomUUID(),
    startTime: performance.now(),
    path,
    method,
  };
}

export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return asyncLocalStorage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function getRequestId(): string | undefined {
  return asyncLocalStorage.getStore()?.requestId;
}

export function getElapsedTime(): number {
  const context = asyncLocalStorage.getStore();
  if (!context) return 0;
  return Math.round((performance.now() - context.startTime) * 100) / 100;
}
