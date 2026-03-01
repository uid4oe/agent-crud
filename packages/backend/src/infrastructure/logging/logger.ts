import type { LogLevel, LogContext, LogEntry, LoggerConfig } from "./types.js";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private context: LogContext = {};

  constructor(private readonly config: LoggerConfig) {}

  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, context, error);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.config.enabled) return;
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.output(entry);
  }

  private output(entry: LogEntry): void {
    const output =
      this.config.format === "json"
        ? JSON.stringify(entry)
        : this.formatPretty(entry);

    switch (entry.level) {
      case "debug":
      case "info":
        console.log(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
    }
  }

  private formatPretty(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";
    const dim = "\x1b[2m";

    const color = levelColors[entry.level];
    const levelStr = entry.level.toUpperCase().padEnd(5);
    const time = entry.timestamp.split("T")[1].replace("Z", "");

    let output = `${dim}${time}${reset} ${color}${levelStr}${reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = Object.entries(entry.context)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(" ");
      if (contextStr) {
        output += ` ${dim}${contextStr}${reset}`;
      }
    }

    if (entry.error) {
      output += `\n${color}  Error: ${entry.error.message}${reset}`;
      if (entry.error.stack) {
        output += `\n${dim}${entry.error.stack}${reset}`;
      }
    }

    return output;
  }
}

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const fullConfig: LoggerConfig = {
    level: config.level ?? "info",
    format: config.format ?? "pretty",
    enabled: config.enabled ?? true,
  };
  return new Logger(fullConfig);
}
