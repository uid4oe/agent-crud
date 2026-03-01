import { LlmAgent } from "@google/adk";
import type { GoalRepositoryPort, NoteRepositoryPort, TaskRepositoryPort } from "../../../../domain/index.js";
import { GOAL_AGENT_SYSTEM_PROMPT } from "../prompts/goal.prompt.js";
import { createCrossDomainTools } from "../tools/cross-domain.tools.js";
import { createGoalTools } from "../tools/goal.tools.js";
import { injectToolsTable, withCurrentDate } from "../tools/tool-helpers.js";

export function createGoalAgent(
  goalRepository: GoalRepositoryPort,
  model: string,
  crossDomainDeps?: {
    taskRepository?: TaskRepositoryPort;
    noteRepository?: NoteRepositoryPort;
  }
): LlmAgent {
  const tools = [
    ...createGoalTools(goalRepository),
    ...createCrossDomainTools({
      taskRepository: crossDomainDeps?.taskRepository,
      noteRepository: crossDomainDeps?.noteRepository,
    }),
  ];

  return new LlmAgent({
    name: "GoalAgent",
    model,
    description:
      "Handles everything related to goals and milestones (any category — fitness, career, financial, learning, etc.): creating, listing, searching, tracking progress, toggling milestones, editing, deleting, and statistics. Full language abilities (translate, rewrite, analyse). Can also create tasks/notes and search across domains for cross-referencing.",
    instruction: withCurrentDate(injectToolsTable(GOAL_AGENT_SYSTEM_PROMPT, tools)),
    tools,
    outputKey: "goal_agent_response",
    disallowTransferToParent: true,
    disallowTransferToPeers: true,
  });
}
