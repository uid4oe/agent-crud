import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
import type { Config } from "./types.js";

// Load from monorepo root .env
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

export const configSchema = z.object({
  env: z.enum(["development", "production", "test"]).default("development"),
  server: z.object({
    port: z.coerce.number().int().min(1).max(65535).default(3000),
    host: z.string().default("0.0.0.0"),
    corsOrigins: z.array(z.string()).default(["http://localhost:5173"]),
  }),
  database: z.object({
    url: z.string().min(1),
    poolSize: z.coerce.number().int().min(1).max(100).default(10),
    ssl: z.coerce.boolean().default(false),
  }),
  gemini: z.object({
    apiKey: z.string().min(1),
    model: z.string().min(1),
    routerModel: z.string().optional(),
  }),
  langfuse: z.object({
    secretKey: z.string().min(1),
    publicKey: z.string().min(1),
    baseUrl: z.string().url(),
    enabled: z.coerce.boolean().default(true),
  }),
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    format: z.enum(["json", "pretty"]).default("pretty"),
  }),
  rateLimit: z.object({
    enabled: z.coerce.boolean().default(true),
    windowMs: z.coerce.number().int().min(1000).default(60000),
    maxRequests: z.coerce.number().int().min(1).default(100),
  }),
});

function loadConfig(): Config {
  const env = process.env.NODE_ENV || "development";
  const isDev = env === "development";

  const rawConfig = {
    env,
    server: {
      port: process.env.PORT,
      host: process.env.HOST,
      corsOrigins: process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()),
    },
    database: {
      url: process.env.DATABASE_URL,
      poolSize: process.env.DB_POOL_SIZE,
      ssl: process.env.DB_SSL,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
      routerModel: process.env.GEMINI_ROUTER_MODEL,
    },
    langfuse: {
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
      enabled: process.env.LANGFUSE_ENABLED,
    },
    logging: {
      level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
      format: process.env.LOG_FORMAT || (isDev ? "pretty" : "json"),
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED,
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    },
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}

export function isDevelopment(): boolean {
  return getConfig().env === "development";
}

export function isProduction(): boolean {
  return getConfig().env === "production";
}

export function isTest(): boolean {
  return getConfig().env === "test";
}

export const config = getConfig();
