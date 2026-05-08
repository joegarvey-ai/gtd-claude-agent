import { writeFileSync, mkdirSync, existsSync, appendFileSync } from "fs";
import { resolve, dirname } from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type AgentRole = "gtd-assistant" | "bee-processor" | "status-updater" | "eval-runner";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  traceId: string;
  spanId?: string;
  agent: AgentRole;
  operation: string;
  message: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
  tokens?: { input: number; output: number; cacheHits?: number };
}

export interface LoggerConfig {
  logDir: string;
  agent: AgentRole;
  traceId?: string;
  minLevel?: LogLevel;
  stdout?: boolean;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class Logger {
  private config: Required<LoggerConfig>;
  private logFile: string;

  constructor(config: LoggerConfig) {
    this.config = {
      minLevel: "info",
      stdout: false,
      traceId: config.traceId ?? generateId(),
      ...config,
    };

    if (!existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true });
    }

    const date = new Date().toISOString().split("T")[0];
    this.logFile = resolve(this.config.logDir, `${date}.jsonl`);
  }

  get traceId(): string {
    return this.config.traceId;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.config.minLevel];
  }

  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const line = JSON.stringify(entry) + "\n";
    appendFileSync(this.logFile, line);

    if (this.config.stdout) {
      const icon = { debug: "·", info: "→", warn: "⚠", error: "✗" }[entry.level];
      const duration = entry.durationMs ? ` (${entry.durationMs}ms)` : "";
      const tokens = entry.tokens
        ? ` [${entry.tokens.input}→${entry.tokens.output} tok]`
        : "";
      console.log(`${icon} ${entry.operation}: ${entry.message}${duration}${tokens}`);
    }
  }

  log(
    level: LogLevel,
    operation: string,
    message: string,
    opts?: { spanId?: string; metadata?: Record<string, unknown>; durationMs?: number; tokens?: LogEntry["tokens"] }
  ): void {
    this.write({
      timestamp: new Date().toISOString(),
      level,
      traceId: this.config.traceId,
      spanId: opts?.spanId,
      agent: this.config.agent,
      operation,
      message,
      metadata: opts?.metadata,
      durationMs: opts?.durationMs,
      tokens: opts?.tokens,
    });
  }

  debug(operation: string, message: string, opts?: Parameters<Logger["log"]>[3]): void {
    this.log("debug", operation, message, opts);
  }

  info(operation: string, message: string, opts?: Parameters<Logger["log"]>[3]): void {
    this.log("info", operation, message, opts);
  }

  warn(operation: string, message: string, opts?: Parameters<Logger["log"]>[3]): void {
    this.log("warn", operation, message, opts);
  }

  error(operation: string, message: string, opts?: Parameters<Logger["log"]>[3]): void {
    this.log("error", operation, message, opts);
  }
}

export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}
