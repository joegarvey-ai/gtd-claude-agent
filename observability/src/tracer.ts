import { Logger, AgentRole } from "./logger.js";

export interface Span {
  spanId: string;
  operation: string;
  startTime: number;
  endTime?: number;
  status: "running" | "success" | "error";
  children: Span[];
  metadata?: Record<string, unknown>;
  tokens?: { input: number; output: number; cacheHits?: number };
}

export interface Trace {
  traceId: string;
  agent: AgentRole;
  operation: string;
  startTime: string;
  endTime?: string;
  totalDurationMs?: number;
  totalTokens: { input: number; output: number; cacheHits: number };
  spans: Span[];
  status: "running" | "success" | "error";
}

function generateSpanId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export class Tracer {
  private logger: Logger;
  private trace: Trace;
  private spanStack: Span[] = [];

  constructor(logger: Logger, operation: string, agent: AgentRole) {
    this.logger = logger;
    this.trace = {
      traceId: logger.traceId,
      agent,
      operation,
      startTime: new Date().toISOString(),
      totalTokens: { input: 0, output: 0, cacheHits: 0 },
      spans: [],
      status: "running",
    };

    this.logger.info(operation, `Trace started: ${operation}`);
  }

  startSpan(operation: string, metadata?: Record<string, unknown>): string {
    const span: Span = {
      spanId: generateSpanId(),
      operation,
      startTime: Date.now(),
      status: "running",
      children: [],
      metadata,
    };

    if (this.spanStack.length > 0) {
      this.spanStack[this.spanStack.length - 1].children.push(span);
    } else {
      this.trace.spans.push(span);
    }

    this.spanStack.push(span);
    this.logger.debug(operation, `Span started`, { spanId: span.spanId, metadata });
    return span.spanId;
  }

  endSpan(opts?: {
    status?: "success" | "error";
    tokens?: { input: number; output: number; cacheHits?: number };
    metadata?: Record<string, unknown>;
  }): void {
    const span = this.spanStack.pop();
    if (!span) return;

    span.endTime = Date.now();
    span.status = opts?.status ?? "success";

    if (opts?.tokens) {
      span.tokens = opts.tokens;
      this.trace.totalTokens.input += opts.tokens.input;
      this.trace.totalTokens.output += opts.tokens.output;
      this.trace.totalTokens.cacheHits += opts.tokens.cacheHits ?? 0;
    }

    if (opts?.metadata) {
      span.metadata = { ...span.metadata, ...opts.metadata };
    }

    const durationMs = span.endTime - span.startTime;
    this.logger.info(span.operation, `Span completed (${span.status})`, {
      spanId: span.spanId,
      durationMs,
      tokens: opts?.tokens,
    });
  }

  endTrace(status?: "success" | "error"): Trace {
    // Close any unclosed spans
    while (this.spanStack.length > 0) {
      this.endSpan({ status: "error" });
    }

    this.trace.endTime = new Date().toISOString();
    this.trace.status = status ?? "success";
    this.trace.totalDurationMs =
      new Date(this.trace.endTime).getTime() - new Date(this.trace.startTime).getTime();

    this.logger.info(this.trace.operation, `Trace completed (${this.trace.status})`, {
      durationMs: this.trace.totalDurationMs,
      tokens: this.trace.totalTokens,
    });

    return this.trace;
  }

  getTrace(): Trace {
    return this.trace;
  }
}

export function createTracer(logger: Logger, operation: string, agent: AgentRole): Tracer {
  return new Tracer(logger, operation, agent);
}
