import { describe, expect, it } from "vitest";
import { configSchema } from "./config.js";

// ---------------------------------------------------------------------------
// configSchema validation tests
// ---------------------------------------------------------------------------

describe("configSchema", () => {
  const validConfig = {
    env: "development",
    server: { port: 3000, host: "0.0.0.0", corsOrigins: ["http://localhost:5173"] },
    database: { url: "postgres://localhost:5432/test", poolSize: 10, ssl: false },
    gemini: { apiKey: "test-key", model: "gemini-2.0-flash" },
    langfuse: {
      secretKey: "sk-test",
      publicKey: "pk-test",
      baseUrl: "http://localhost:3001",
      enabled: true,
    },
    logging: { level: "info", format: "pretty" },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 100 },
  };

  it("accepts valid config", () => {
    const result = configSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("applies defaults for optional fields", () => {
    const minimal = {
      server: {},
      database: { url: "postgres://localhost/db" },
      gemini: { apiKey: "key", model: "model" },
      langfuse: { secretKey: "sk", publicKey: "pk", baseUrl: "http://localhost:3001" },
      logging: {},
      rateLimit: {},
    };

    const result = configSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.env).toBe("development");
      expect(result.data.server.port).toBe(3000);
      expect(result.data.server.host).toBe("0.0.0.0");
      expect(result.data.logging.level).toBe("info");
      expect(result.data.rateLimit.maxRequests).toBe(100);
    }
  });

  it("coerces string port to number", () => {
    const config = {
      ...validConfig,
      server: { ...validConfig.server, port: "8080" },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.server.port).toBe(8080);
    }
  });

  it("coerces truthy string to boolean true", () => {
    const config = {
      ...validConfig,
      database: { ...validConfig.database, ssl: "true" },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database.ssl).toBe(true);
    }
  });

  it("coerces boolean false directly", () => {
    const config = {
      ...validConfig,
      rateLimit: { ...validConfig.rateLimit, enabled: false },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rateLimit.enabled).toBe(false);
    }
  });

  it("rejects missing database URL", () => {
    const config = {
      ...validConfig,
      database: { ...validConfig.database, url: "" },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects missing gemini API key", () => {
    const config = {
      ...validConfig,
      gemini: { ...validConfig.gemini, apiKey: "" },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid port range", () => {
    const tooHigh = {
      ...validConfig,
      server: { ...validConfig.server, port: 99999 },
    };
    expect(configSchema.safeParse(tooHigh).success).toBe(false);

    const tooLow = {
      ...validConfig,
      server: { ...validConfig.server, port: 0 },
    };
    expect(configSchema.safeParse(tooLow).success).toBe(false);
  });

  it("rejects invalid env value", () => {
    const config = { ...validConfig, env: "staging" };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid log level", () => {
    const config = {
      ...validConfig,
      logging: { level: "verbose", format: "pretty" },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid langfuse baseUrl (not a URL)", () => {
    const config = {
      ...validConfig,
      langfuse: { ...validConfig.langfuse, baseUrl: "not-a-url" },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("accepts all valid environments", () => {
    for (const env of ["development", "production", "test"]) {
      const result = configSchema.safeParse({ ...validConfig, env });
      expect(result.success).toBe(true);
    }
  });

  it("accepts optional gemini routerModel", () => {
    const config = {
      ...validConfig,
      gemini: { ...validConfig.gemini, routerModel: "gemini-2.0-flash-lite" },
    };
    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gemini.routerModel).toBe("gemini-2.0-flash-lite");
    }
  });
});
