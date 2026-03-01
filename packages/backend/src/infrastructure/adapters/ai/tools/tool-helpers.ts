import type { ToolInputParameters } from "@google/adk";
import type { z } from "zod";

/** Tool execute argument — the parsed Zod object from the LLM call. */
export type ToolArgs = Record<string, unknown>;

// ADK's ToolInputParameters accepts Zod v4 objects directly.
export const params = (schema: z.ZodObject<z.ZodRawShape>): ToolInputParameters =>
  schema;

/**
 * Wrap a tool execute function so that any thrown error is returned as a
 * string the LLM can reason about instead of crashing the agentic loop.
 *
 * The returned function accepts `unknown` to satisfy ADK's
 * `ToolExecuteFunction<Schema>` signature, then narrows to `ToolArgs`
 * internally.
 */
export function safeExecute(
  fn: (args: ToolArgs) => Promise<string>
): (args: unknown) => Promise<string> {
  return async (args: unknown) => {
    try {
      return await fn(args as ToolArgs);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error: ${message}`;
    }
  };
}

/** Minimal shape needed to extract tool metadata for prompt injection. */
export interface ToolMeta {
  readonly name: string;
  readonly description: string;
}

/** Build a markdown table of tool names and descriptions. */
export function buildToolsTable(tools: ToolMeta[]): string {
  const header = "| Tool | Purpose |\n|------|---------|";
  const rows = tools.map((t) => `| ${t.name} | ${t.description} |`);
  return [header, ...rows].join("\n");
}

/** Replace `{{TOOLS_TABLE}}` in a prompt string with a generated markdown table. */
export function injectToolsTable(prompt: string, tools: ToolMeta[]): string {
  return prompt.replace("{{TOOLS_TABLE}}", buildToolsTable(tools));
}
