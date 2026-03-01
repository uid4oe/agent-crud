import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger.js";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("log level filtering", () => {
    it("suppresses debug when level is info", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = createLogger({ level: "info", enabled: true });

      logger.debug("should not appear");

      expect(spy).not.toHaveBeenCalled();
    });

    it("allows info when level is info", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = createLogger({ level: "info", enabled: true });

      logger.info("visible");

      expect(spy).toHaveBeenCalled();
    });

    it("allows warn when level is info", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const logger = createLogger({ level: "info", enabled: true });

      logger.warn("warning");

      expect(spy).toHaveBeenCalled();
    });

    it("allows error when level is info", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logger = createLogger({ level: "info", enabled: true });

      logger.error("failure", new Error("bad"));

      expect(spy).toHaveBeenCalled();
    });

    it("suppresses everything below error when level is error", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const logger = createLogger({ level: "error", enabled: true });

      logger.debug("nope");
      logger.info("nope");
      logger.warn("nope");

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("allows all when level is debug", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logger = createLogger({ level: "debug", enabled: true });

      logger.debug("d");
      logger.info("i");
      logger.warn("w");
      logger.error("e");

      expect(logSpy).toHaveBeenCalledTimes(2); // debug + info
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("enabled flag", () => {
    it("suppresses all output when disabled", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logger = createLogger({ level: "debug", enabled: false });

      logger.debug("x");
      logger.info("x");
      logger.warn("x");
      logger.error("x");

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe("JSON format", () => {
    it("outputs valid JSON", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = createLogger({ level: "info", format: "json", enabled: true });

      logger.info("test message", { key: "value" });

      const output = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.message).toBe("test message");
      expect(parsed.level).toBe("info");
      expect(parsed.context).toEqual(expect.objectContaining({ key: "value" }));
      expect(parsed.timestamp).toBeDefined();
    });

    it("includes error details in JSON", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logger = createLogger({ level: "error", format: "json", enabled: true });

      logger.error("fail", new Error("boom"));

      const output = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.error.name).toBe("Error");
      expect(parsed.error.message).toBe("boom");
    });
  });

  describe("child logger", () => {
    it("inherits parent context", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const parent = createLogger({ level: "info", format: "json", enabled: true });
      const child = parent.child({ requestId: "req-1" });

      child.info("from child");

      const output = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.context.requestId).toBe("req-1");
    });

    it("merges child context with call context", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const parent = createLogger({ level: "info", format: "json", enabled: true });
      const child = parent.child({ service: "task" });

      child.info("test", { method: "create" });

      const output = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.context.service).toBe("task");
      expect(parsed.context.method).toBe("create");
    });

    it("does not affect parent logger context", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const parent = createLogger({ level: "info", format: "json", enabled: true });
      parent.child({ extra: "data" });

      parent.info("from parent");

      const output = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.context.extra).toBeUndefined();
    });
  });

  describe("createLogger defaults", () => {
    it("defaults to info level, pretty format, enabled", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const logger = createLogger();
      logger.info("test");
      expect(spy).toHaveBeenCalled();
    });
  });
});
