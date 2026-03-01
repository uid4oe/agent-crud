import { LlmAgent } from "@google/adk";

import { ROUTER_SYSTEM_PROMPT } from "../prompts/router.prompt.js";
import { withCurrentDate } from "../tools/tool-helpers.js";
import type { RootAgentDeps } from "../types.js";
import { createGoalAgent } from "./goal-agent.factory.js";
import { createNoteAgent } from "./note-agent.factory.js";
import { createTaskAgent } from "./task-agent.factory.js";

export function createRootAgent(deps: RootAgentDeps): LlmAgent {
  const taskAgent = createTaskAgent(deps.taskRepository, deps.model, {
    noteRepository: deps.noteRepository,
    goalRepository: deps.goalRepository,
  });
  const noteAgent = createNoteAgent(deps.noteRepository, deps.model, {
    taskRepository: deps.taskRepository,
    goalRepository: deps.goalRepository,
  });
  const goalAgent = createGoalAgent(deps.goalRepository, deps.model, {
    taskRepository: deps.taskRepository,
    noteRepository: deps.noteRepository,
  });

  return new LlmAgent({
    name: "RouterAgent",
    model: deps.routerModel ?? deps.model,
    description: "Root routing agent that delegates to specialized sub-agents.",
    instruction: withCurrentDate(ROUTER_SYSTEM_PROMPT),
    subAgents: [taskAgent, noteAgent, goalAgent],
  });
}
