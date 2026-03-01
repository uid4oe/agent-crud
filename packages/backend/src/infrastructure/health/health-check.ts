/**
 * Health Check System
 *
 * Provides health and readiness checks for:
 * - Kubernetes/Docker health probes
 * - Load balancer health checks
 * - Monitoring and alerting
 *
 * Components:
 * - Liveness: Is the application running?
 * - Readiness: Is the application ready to serve traffic?
 * - Startup: Has the application finished starting?
 */

import { Router, Request, Response } from "express";
import { DbClient } from "../adapters/persistence/drizzle/client.js";
import { sql } from "drizzle-orm";
import { Logger } from "../logging/index.js";

export type HealthStatus = "healthy" | "unhealthy" | "degraded";

export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  duration?: number;
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message?: string;
  duration?: number;
}

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  components: ComponentHealth[];
}

export type HealthChecker = () => Promise<HealthCheckResult>;

/**
 * Health check registry for managing component health checks
 */
export class HealthCheckRegistry {
  private checks = new Map<string, HealthChecker>();
  private startTime = Date.now();
  private logger: Logger;
  private version: string;

  constructor(logger: Logger, version: string = "1.0.0") {
    this.logger = logger.child({ component: "HealthCheck" });
    this.version = version;
  }

  /**
   * Register a health check
   */
  register(name: string, checker: HealthChecker): void {
    this.checks.set(name, checker);
    this.logger.debug("Health check registered", { name });
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run all health checks
   */
  async checkAll(): Promise<HealthResponse> {
    const components: ComponentHealth[] = [];
    let overallStatus: HealthStatus = "healthy";

    for (const [name, checker] of this.checks) {
      const start = performance.now();
      try {
        const result = await checker();
        components.push({
          name,
          status: result.status,
          message: result.message,
          duration: Math.round(performance.now() - start),
        });

        if (result.status === "unhealthy") {
          overallStatus = "unhealthy";
        } else if (result.status === "degraded" && overallStatus === "healthy") {
          overallStatus = "degraded";
        }
      } catch (error) {
        components.push({
          name,
          status: "unhealthy",
          message: error instanceof Error ? error.message : "Unknown error",
          duration: Math.round(performance.now() - start),
        });
        overallStatus = "unhealthy";
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      components,
    };
  }

  /**
   * Quick liveness check (just checks if process is running)
   */
  async checkLiveness(): Promise<{ status: "ok" }> {
    return { status: "ok" };
  }

  /**
   * Create Express router with health endpoints
   */
  createRouter(): Router {
    const router = Router();

    // Liveness probe - is the process alive?
    router.get("/health/live", async (_req: Request, res: Response) => {
      const result = await this.checkLiveness();
      res.json(result);
    });

    // Readiness probe - is the app ready to serve traffic?
    router.get("/health/ready", async (_req: Request, res: Response) => {
      const result = await this.checkAll();
      const statusCode = result.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(result);
    });

    // Detailed health check
    router.get("/health", async (_req: Request, res: Response) => {
      const result = await this.checkAll();
      const statusCode = result.status === "healthy" ? 200 :
                         result.status === "degraded" ? 200 : 503;
      res.status(statusCode).json(result);
    });

    return router;
  }
}

/**
 * Database health check factory
 */
export function createDatabaseHealthCheck(db: DbClient): HealthChecker {
  return async () => {
    try {
      // Simple query to check database connectivity
      await db.execute(sql`SELECT 1`);
      return { status: "healthy" };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Database connection failed",
      };
    }
  };
}

/**
 * Memory health check factory
 */
export function createMemoryHealthCheck(
  thresholdMB: number = 500
): HealthChecker {
  return async () => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = process.memoryUsage().heapTotal / 1024 / 1024;

    if (used > thresholdMB) {
      return {
        status: "degraded",
        message: `High memory usage: ${Math.round(used)}MB / ${Math.round(total)}MB`,
      };
    }

    return {
      status: "healthy",
      message: `Memory: ${Math.round(used)}MB / ${Math.round(total)}MB`,
    };
  };
}

/**
 * External service health check factory
 */
export function createExternalServiceHealthCheck(
  name: string,
  checkFn: () => Promise<void>,
  timeoutMs: number = 5000
): HealthChecker {
  return async () => {
    try {
      await Promise.race([
        checkFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeoutMs)
        ),
      ]);
      return { status: "healthy" };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `${name}: ${error instanceof Error ? error.message : "Failed"}`,
      };
    }
  };
}

/**
 * AI (Gemini) health check factory
 */
export function createAiHealthCheck(apiKey: string, model: string): HealthChecker {
  return async () => {
    try {
      const response = await Promise.race([
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "ping" }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        ),
      ]);

      if (!response.ok) {
        return {
          status: "degraded" as HealthStatus,
          message: `Gemini API returned ${response.status}`,
        };
      }

      return { status: "healthy" as HealthStatus };
    } catch (error) {
      return {
        status: "degraded" as HealthStatus,
        message: `Gemini: ${error instanceof Error ? error.message : "Failed"}`,
      };
    }
  };
}
