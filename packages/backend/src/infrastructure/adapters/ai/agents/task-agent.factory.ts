import { LlmAgent } from "@google/adk";
import type { TaskRepositoryPort, NoteRepositoryPort, GoalRepositoryPort } from "../../../../domain/index.js";
import { createTaskTools } from "../tools/task.tools.js";
import { createCrossDomainTools } from "../tools/cross-domain.tools.js";
import { injectToolsTable } from "../tools/tool-helpers.js";
import { TASK_AGENT_SYSTEM_PROMPT } from "../prompts/task.prompt.js";

export function createTaskAgent(
  taskRepository: TaskRepositoryPort,
  model: string,
  crossDomainDeps?: {
    noteRepository?: NoteRepositoryPort;
    goalRepository?: GoalRepositoryPort;
  }
): LlmAgent {
  const tools = [
    ...createTaskTools(taskRepository),
    ...createCrossDomainTools({
      noteRepository: crossDomainDeps?.noteRepository,
      goalRepository: crossDomainDeps?.goalRepository,
    }),
  ];

  return new LlmAgent({
    name: "TaskAgent",
    model,
    description:
      "Handles everything related to tasks, todos, and reminders: creating, listing, searching, updating status, editing, deleting, bulk updates, and statistics. Full language abilities (translate, rewrite, summarise, analyse). Can also create notes/goals and search across domains for cross-referencing.",
    instruction: injectToolsTable(TASK_AGENT_SYSTEM_PROMPT, tools),
    tools,
    outputKey: "task_agent_response",
    disallowTransferToParent: true,
    disallowTransferToPeers: true,
  });
}
