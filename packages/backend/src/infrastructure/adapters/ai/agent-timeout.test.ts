import { describe, expect, it } from "vitest";
import { AgentTimeoutError, withTimeout } from "./agent-timeout.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function* yieldValues<T>(values: T[], delayMs = 0): AsyncGenerator<T> {
  for (const value of values) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    yield value;
  }
}

async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of gen) items.push(item);
  return items;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AgentTimeoutError", () => {
  it("has correct name and message", () => {
    const err = new AgentTimeoutError(5000);
    expect(err.name).toBe("AgentTimeoutError");
    expect(err.message).toContain("5000ms");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("withTimeout", () => {
  it("yields all values when under timeout", async () => {
    const source = yieldValues([1, 2, 3]);
    const result = await collect(withTimeout(source, 5000));
    expect(result).toEqual([1, 2, 3]);
  });

  it("throws AgentTimeoutError when source is too slow", async () => {
    const source = yieldValues([1, 2], 200); // 200ms between items

    await expect(async () => {
      await collect(withTimeout(source, 50)); // 50ms timeout
    }).rejects.toThrow(AgentTimeoutError);
  });

  it("handles empty source", async () => {
    const source = yieldValues([]);
    const result = await collect(withTimeout(source, 5000));
    expect(result).toEqual([]);
  });

  it("handles single-item source", async () => {
    const source = yieldValues(["hello"]);
    const result = await collect(withTimeout(source, 5000));
    expect(result).toEqual(["hello"]);
  });

  it("resets timeout between yields", async () => {
    // Each yield is 30ms apart, timeout is 100ms — should succeed
    const source = yieldValues([1, 2, 3, 4, 5], 30);
    const result = await collect(withTimeout(source, 100));
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});
