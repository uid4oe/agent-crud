import { describe, expect, it } from "vitest";
import { buildToolsTable, injectToolsTable, safeExecute, type ToolArgs, type ToolMeta } from "./tool-helpers.js";

describe("safeExecute", () => {
  it("returns the result when function succeeds", async () => {
    const wrapped = safeExecute(async (args: ToolArgs) => {
      return `Created task: ${args.title}`;
    });

    const result = await wrapped({ title: "Buy milk" });

    expect(result).toBe("Created task: Buy milk");
  });

  it("catches thrown Error and returns formatted string", async () => {
    const wrapped = safeExecute(async () => {
      throw new Error("Task not found");
    });

    const result = await wrapped({});

    expect(result).toBe("Error: Task not found");
  });

  it("catches non-Error throws and stringifies", async () => {
    const wrapped = safeExecute(async () => {
      throw "string error";
    });

    const result = await wrapped({});

    expect(result).toBe("Error: string error");
  });

  it("passes args through as ToolArgs", async () => {
    const wrapped = safeExecute(async (args) => {
      return JSON.stringify(args);
    });

    const result = await wrapped({ status: "pending", limit: 10 });

    expect(JSON.parse(result)).toEqual({ status: "pending", limit: 10 });
  });
});

describe("buildToolsTable", () => {
  it("returns header-only table for empty tools array", () => {
    const result = buildToolsTable([]);

    expect(result).toBe("| Tool | Purpose |\n|------|---------|");
  });

  it("builds a markdown table from a single tool", () => {
    const tools: ToolMeta[] = [
      { name: "create_task", description: "Create a new task" },
    ];

    const result = buildToolsTable(tools);

    expect(result).toBe(
      "| Tool | Purpose |\n|------|---------|\n| create_task | Create a new task |"
    );
  });

  it("builds a markdown table from multiple tools", () => {
    const tools: ToolMeta[] = [
      { name: "list_tasks", description: "List all tasks" },
      { name: "create_task", description: "Create a new task" },
      { name: "delete_task", description: "Delete a task by ID" },
    ];

    const result = buildToolsTable(tools);
    const lines = result.split("\n");

    expect(lines).toHaveLength(5); // header + separator + 3 rows
    expect(lines[0]).toBe("| Tool | Purpose |");
    expect(lines[1]).toBe("|------|---------|");
    expect(lines[2]).toBe("| list_tasks | List all tasks |");
    expect(lines[3]).toBe("| create_task | Create a new task |");
    expect(lines[4]).toBe("| delete_task | Delete a task by ID |");
  });
});

describe("injectToolsTable", () => {
  it("replaces {{TOOLS_TABLE}} placeholder with generated table", () => {
    const prompt = "Some intro\n\n## Tools\n\n{{TOOLS_TABLE}}\n\n## Response";
    const tools: ToolMeta[] = [
      { name: "list_tasks", description: "List all tasks" },
    ];

    const result = injectToolsTable(prompt, tools);

    expect(result).toContain("| list_tasks | List all tasks |");
    expect(result).not.toContain("{{TOOLS_TABLE}}");
    expect(result).toContain("## Tools");
    expect(result).toContain("## Response");
  });

  it("leaves prompt unchanged when no placeholder exists", () => {
    const prompt = "No placeholder here";
    const tools: ToolMeta[] = [
      { name: "create_task", description: "Create a task" },
    ];

    const result = injectToolsTable(prompt, tools);

    expect(result).toBe("No placeholder here");
  });

  it("only replaces the first occurrence of the placeholder", () => {
    const prompt = "{{TOOLS_TABLE}} and {{TOOLS_TABLE}}";
    const tools: ToolMeta[] = [
      { name: "foo", description: "bar" },
    ];

    const result = injectToolsTable(prompt, tools);

    expect(result).toContain("| foo | bar |");
    expect(result).toContain("{{TOOLS_TABLE}}");
    // First replaced, second kept
    expect(result.indexOf("{{TOOLS_TABLE}}")).toBeGreaterThan(0);
  });
});
