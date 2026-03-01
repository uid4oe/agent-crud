import { describe, expect, it } from "vitest";
import { createLogger } from "../logging/index.js";
import {
  createExternalServiceHealthCheck,
  createMemoryHealthCheck,
  HealthCheckRegistry,
} from "./health-check.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function silentLogger() {
  return createLogger({ enabled: false });
}

// ---------------------------------------------------------------------------
// HealthCheckRegistry
// ---------------------------------------------------------------------------

describe("HealthCheckRegistry", () => {
  it("reports healthy when all checks pass", async () => {
    const registry = new HealthCheckRegistry(silentLogger(), "1.0.0");
    registry.register("db", async () => ({ status: "healthy" }));
    registry.register("cache", async () => ({ status: "healthy" }));

    const result = await registry.checkAll();

    expect(result.status).toBe("healthy");
    expect(result.version).toBe("1.0.0");
    expect(result.components).toHaveLength(2);
    expect(result.components[0].status).toBe("healthy");
    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeDefined();
  });

  it("reports unhealthy when any check fails", async () => {
    const registry = new HealthCheckRegistry(silentLogger());
    registry.register("db", async () => ({ status: "healthy" }));
    registry.register("broken", async () => ({
      status: "unhealthy",
      message: "Connection refused",
    }));

    const result = await registry.checkAll();

    expect(result.status).toBe("unhealthy");
    expect(result.components.find((c) => c.name === "broken")?.message).toBe(
      "Connection refused"
    );
  });

  it("reports degraded when a check is degraded but none unhealthy", async () => {
    const registry = new HealthCheckRegistry(silentLogger());
    registry.register("db", async () => ({ status: "healthy" }));
    registry.register("memory", async () => ({ status: "degraded", message: "High usage" }));

    const result = await registry.checkAll();

    expect(result.status).toBe("degraded");
  });

  it("catches thrown errors and marks as unhealthy", async () => {
    const registry = new HealthCheckRegistry(silentLogger());
    registry.register("explosive", async () => {
      throw new Error("kaboom");
    });

    const result = await registry.checkAll();

    expect(result.status).toBe("unhealthy");
    expect(result.components[0].message).toBe("kaboom");
  });

  it("measures duration of health checks", async () => {
    const registry = new HealthCheckRegistry(silentLogger());
    registry.register("slow", async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { status: "healthy" };
    });

    const result = await registry.checkAll();

    expect(result.components[0].duration).toBeGreaterThanOrEqual(0);
  });

  it("unregister removes a check", async () => {
    const registry = new HealthCheckRegistry(silentLogger());
    registry.register("temp", async () => ({ status: "healthy" }));
    registry.unregister("temp");

    const result = await registry.checkAll();
    expect(result.components).toHaveLength(0);
  });

  it("liveness always returns ok", async () => {
    const registry = new HealthCheckRegistry(silentLogger());
    const result = await registry.checkLiveness();
    expect(result.status).toBe("ok");
  });

  it("reports healthy with no registered checks", async () => {
    const registry = new HealthCheckRegistry(silentLogger());
    const result = await registry.checkAll();
    expect(result.status).toBe("healthy");
    expect(result.components).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Health check factories
// ---------------------------------------------------------------------------

describe("createMemoryHealthCheck", () => {
  it("returns healthy when under threshold", async () => {
    const check = createMemoryHealthCheck(9999); // very high threshold
    const result = await check();
    expect(result.status).toBe("healthy");
  });

  it("returns degraded when over threshold", async () => {
    const check = createMemoryHealthCheck(0.001); // impossibly low threshold
    const result = await check();
    expect(result.status).toBe("degraded");
    expect(result.message).toContain("High memory");
  });
});

describe("createExternalServiceHealthCheck", () => {
  it("returns healthy when check succeeds", async () => {
    const check = createExternalServiceHealthCheck("test", async () => {});
    const result = await check();
    expect(result.status).toBe("healthy");
  });

  it("returns unhealthy when check throws", async () => {
    const check = createExternalServiceHealthCheck("test", async () => {
      throw new Error("down");
    });
    const result = await check();
    expect(result.status).toBe("unhealthy");
    expect(result.message).toContain("down");
  });

  it("returns unhealthy on timeout", async () => {
    const check = createExternalServiceHealthCheck(
      "slow",
      async () => {
        await new Promise((r) => setTimeout(r, 500));
      },
      10 // 10ms timeout
    );
    const result = await check();
    expect(result.status).toBe("unhealthy");
    expect(result.message).toContain("Timeout");
  });
});
