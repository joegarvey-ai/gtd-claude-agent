import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createLogger, createMeter, recordEvalSnapshot, type AgentRole } from "../../observability/src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const OBS_DIR = resolve(ROOT, "_observability");

const logger = createLogger({
  logDir: resolve(OBS_DIR, "logs"),
  agent: "eval-runner" as AgentRole,
  stdout: process.env.VERBOSE === "1",
});

const meter = createMeter(resolve(OBS_DIR, "metering"), "eval-runner" as AgentRole);

export interface EvalCase {
  name: string;
  userMessage: string;
  systemPromptFile?: string;
  systemPromptOverride?: string;
  assertions: Assertion[];
  context?: string;
}

export interface Assertion {
  type: "contains" | "not_contains" | "matches" | "json_path";
  value: string;
  description: string;
}

export interface EvalResult {
  name: string;
  passed: boolean;
  assertions: AssertionResult[];
  response: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AssertionResult {
  description: string;
  passed: boolean;
  expected: string;
  actual?: string;
}

export interface SuiteResult {
  suite: string;
  results: EvalResult[];
  passed: number;
  failed: number;
  totalDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

const client = new Anthropic();

export function loadSystemPrompt(filename: string): string {
  const path = resolve(ROOT, filename);
  return readFileSync(path, "utf-8");
}

export function loadFixture(fixturePath: string): string {
  const path = resolve(__dirname, "../fixtures", fixturePath);
  return readFileSync(path, "utf-8");
}

function checkAssertion(response: string, assertion: Assertion): AssertionResult {
  const normalized = response.toLowerCase();

  switch (assertion.type) {
    case "contains": {
      const passed = normalized.includes(assertion.value.toLowerCase());
      return {
        description: assertion.description,
        passed,
        expected: `Response contains "${assertion.value}"`,
        actual: passed ? undefined : `Not found in response`,
      };
    }
    case "not_contains": {
      const passed = !normalized.includes(assertion.value.toLowerCase());
      return {
        description: assertion.description,
        passed,
        expected: `Response does NOT contain "${assertion.value}"`,
        actual: passed ? undefined : `Found "${assertion.value}" in response`,
      };
    }
    case "matches": {
      const regex = new RegExp(assertion.value, "i");
      const passed = regex.test(response);
      return {
        description: assertion.description,
        passed,
        expected: `Response matches /${assertion.value}/i`,
        actual: passed ? undefined : `No match found`,
      };
    }
    case "json_path": {
      // Extract JSON from response (look for ```json blocks or raw JSON)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
        response.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        return {
          description: assertion.description,
          passed: false,
          expected: assertion.value,
          actual: "No JSON found in response",
        };
      }
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const [path, expected] = assertion.value.split("=");
        const keys = path.split(".");
        let current: unknown = parsed;
        for (const key of keys) {
          current = (current as Record<string, unknown>)[key];
        }
        const passed = String(current) === expected;
        return {
          description: assertion.description,
          passed,
          expected: `${path} = ${expected}`,
          actual: `${path} = ${String(current)}`,
        };
      } catch {
        return {
          description: assertion.description,
          passed: false,
          expected: assertion.value,
          actual: "Failed to parse JSON",
        };
      }
    }
  }
}

export async function runEval(evalCase: EvalCase): Promise<EvalResult> {
  const systemPrompt = evalCase.systemPromptOverride ??
    loadSystemPrompt(evalCase.systemPromptFile ?? "system-prompt.md");

  const fullSystem = evalCase.context
    ? `${systemPrompt}\n\n---\n\n## Current Vault State (for this evaluation)\n\n${evalCase.context}`
    : systemPrompt;

  const start = Date.now();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: fullSystem,
    messages: [{ role: "user", content: evalCase.userMessage }],
  });

  const durationMs = Date.now() - start;
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n");

  const assertionResults = evalCase.assertions.map((a) => checkAssertion(text, a));
  const passed = assertionResults.every((r) => r.passed);

  // Record metering
  meter.record({
    operation: evalCase.name,
    model: "claude-sonnet-4-20250514",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheHits: (response.usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0,
    durationMs,
  });

  logger.info("eval-case", `${passed ? "PASS" : "FAIL"}: ${evalCase.name}`, {
    durationMs,
    tokens: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  });

  return {
    name: evalCase.name,
    passed,
    assertions: assertionResults,
    response: text,
    durationMs,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export async function runSuite(
  suiteName: string,
  cases: EvalCase[]
): Promise<SuiteResult> {
  const results: EvalResult[] = [];

  for (const evalCase of cases) {
    process.stdout.write(`  ${evalCase.name}... `);
    try {
      const result = await runEval(evalCase);
      results.push(result);
      console.log(result.passed ? "✓" : "✗");
      if (!result.passed) {
        for (const a of result.assertions.filter((r) => !r.passed)) {
          console.log(`    FAIL: ${a.description}`);
          console.log(`      Expected: ${a.expected}`);
          if (a.actual) console.log(`      Actual: ${a.actual}`);
        }
      }
    } catch (error) {
      console.log("ERROR");
      console.log(`    ${error}`);
      results.push({
        name: evalCase.name,
        passed: false,
        assertions: [],
        response: "",
        durationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    suite: suiteName,
    results,
    passed,
    failed,
    totalDurationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
    totalInputTokens: results.reduce((sum, r) => sum + r.inputTokens, 0),
    totalOutputTokens: results.reduce((sum, r) => sum + r.outputTokens, 0),
  };
}

export function printSuiteResult(result: SuiteResult): void {
  console.log("");
  console.log(`━━━ ${result.suite} ━━━`);
  console.log(
    `${result.passed} passed, ${result.failed} failed (${result.passed + result.failed} total)`
  );
  console.log(
    `Tokens: ${result.totalInputTokens.toLocaleString()} in / ${result.totalOutputTokens.toLocaleString()} out`
  );
  console.log(`Duration: ${(result.totalDurationMs / 1000).toFixed(1)}s`);
  console.log("");

  // Record drift snapshot
  recordEvalSnapshot(resolve(OBS_DIR, "metering"), {
    timestamp: new Date().toISOString(),
    suite: result.suite,
    totalCases: result.passed + result.failed,
    passed: result.passed,
    failed: result.failed,
    passRate: result.passed / (result.passed + result.failed),
    failedCases: result.results.filter((r) => !r.passed).map((r) => r.name),
    totalInputTokens: result.totalInputTokens,
    totalOutputTokens: result.totalOutputTokens,
    totalDurationMs: result.totalDurationMs,
  });
}

export function finalizeMeter(): void {
  meter.finalize();
}
