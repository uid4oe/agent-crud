import { LlmAgent } from "@google/adk";
import type { GoalRepositoryPort, NoteRepositoryPort, TaskRepositoryPort } from "../../../../domain/index.js";
import { NOTE_AGENT_SYSTEM_PROMPT } from "../prompts/note.prompt.js";
import { createCrossDomainTools } from "../tools/cross-domain.tools.js";
import { createNoteTools } from "../tools/note.tools.js";
import { injectToolsTable, withCurrentDate } from "../tools/tool-helpers.js";

export function createNoteAgent(
  noteRepository: NoteRepositoryPort,
  model: string,
  crossDomainDeps?: {
    taskRepository?: TaskRepositoryPort;
    goalRepository?: GoalRepositoryPort;
  }
): LlmAgent {
  const tools = [
    ...createNoteTools(noteRepository),
    ...createCrossDomainTools({
      taskRepository: crossDomainDeps?.taskRepository,
      goalRepository: crossDomainDeps?.goalRepository,
    }),
  ];

  return new LlmAgent({
    name: "NoteAgent",
    model,
    description:
      "Handles everything related to notes, ideas, meeting notes, and references: creating, listing, searching, categorizing, tagging, editing, deleting, and statistics. Full language abilities (translate, rewrite, summarise, brainstorm). Can also create tasks/goals and search across domains for cross-referencing.",
    instruction: withCurrentDate(injectToolsTable(NOTE_AGENT_SYSTEM_PROMPT, tools)),
    tools,
    outputKey: "note_agent_response",
    disallowTransferToParent: true,
    disallowTransferToPeers: true,
  });
}
