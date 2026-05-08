import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve } from "path";

export interface ProcessingState {
  sessionId: string;
  agent: string;
  operation: string;
  startedAt: string;
  lastCheckpoint: string;
  status: "in_progress" | "completed" | "failed" | "interrupted";
  progress: {
    totalItems: number;
    processedItems: number;
    currentItem?: string;
  };
  pendingSentinels: string[];
  completedOutputs: string[];
  metadata?: Record<string, unknown>;
}

const STATE_DIR = ".kiro/bee-inbox/_state";

function getStatePath(baseDir: string, sessionId: string): string {
  return resolve(baseDir, STATE_DIR, `${sessionId}.json`);
}

export function saveCheckpoint(baseDir: string, state: ProcessingState): void {
  const stateDir = resolve(baseDir, STATE_DIR);
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }

  state.lastCheckpoint = new Date().toISOString();
  const statePath = getStatePath(baseDir, state.sessionId);
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export function loadCheckpoint(baseDir: string, sessionId: string): ProcessingState | null {
  const statePath = getStatePath(baseDir, sessionId);
  if (!existsSync(statePath)) return null;

  try {
    return JSON.parse(readFileSync(statePath, "utf-8")) as ProcessingState;
  } catch {
    return null;
  }
}

export function findInterruptedSessions(baseDir: string): ProcessingState[] {
  const stateDir = resolve(baseDir, STATE_DIR);
  if (!existsSync(stateDir)) return [];

  const files = readdirSync(stateDir).filter((f) => f.endsWith(".json"));
  const interrupted: ProcessingState[] = [];

  for (const file of files) {
    const content = readFileSync(resolve(stateDir, file), "utf-8");
    try {
      const state = JSON.parse(content) as ProcessingState;
      if (state.status === "in_progress" || state.status === "interrupted") {
        interrupted.push(state);
      }
    } catch {
      // Skip corrupted state files
    }
  }

  return interrupted;
}

export function markCompleted(baseDir: string, sessionId: string): void {
  const statePath = getStatePath(baseDir, sessionId);
  if (!existsSync(statePath)) return;

  const state = JSON.parse(readFileSync(statePath, "utf-8")) as ProcessingState;
  state.status = "completed";
  state.lastCheckpoint = new Date().toISOString();
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export function markFailed(baseDir: string, sessionId: string, reason?: string): void {
  const statePath = getStatePath(baseDir, sessionId);
  if (!existsSync(statePath)) return;

  const state = JSON.parse(readFileSync(statePath, "utf-8")) as ProcessingState;
  state.status = "failed";
  state.lastCheckpoint = new Date().toISOString();
  if (reason) state.metadata = { ...state.metadata, failureReason: reason };
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export function createProcessingState(
  agent: string,
  operation: string,
  sentinels: string[],
  totalItems: number
): ProcessingState {
  return {
    sessionId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    agent,
    operation,
    startedAt: new Date().toISOString(),
    lastCheckpoint: new Date().toISOString(),
    status: "in_progress",
    progress: {
      totalItems,
      processedItems: 0,
    },
    pendingSentinels: sentinels,
    completedOutputs: [],
  };
}
