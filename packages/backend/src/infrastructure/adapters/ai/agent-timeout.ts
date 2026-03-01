/**
 * Thrown when the agent exceeds its time budget.
 */
export class AgentTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Agent did not respond within ${timeoutMs}ms`);
    this.name = "AgentTimeoutError";
  }
}

/**
 * Wrap an async iterable with a timeout. If no new event arrives within
 * `timeoutMs`, the iteration is aborted with an AgentTimeoutError.
 */
export async function* withTimeout<T>(
  source: AsyncIterable<T>,
  timeoutMs: number
): AsyncGenerator<T> {
  const iterator = source[Symbol.asyncIterator]();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = () =>
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new AgentTimeoutError(timeoutMs)),
        timeoutMs
      );
    });

  try {
    while (true) {
      const result = await Promise.race([
        iterator.next(),
        timeoutPromise(),
      ]);

      clearTimeout(timer);

      if (result.done) break;
      yield result.value;
    }
  } finally {
    clearTimeout(timer);
    await iterator.return?.();
  }
}
