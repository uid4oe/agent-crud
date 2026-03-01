import type { GoalRepositoryPort, NoteRepositoryPort, TaskRepositoryPort } from "../../../domain/index.js";

export interface RootAgentDeps {
  taskRepository: TaskRepositoryPort;
  noteRepository: NoteRepositoryPort;
  goalRepository: GoalRepositoryPort;
  model: string;
  routerModel?: string;
}

export interface AdkAgentAdapterConfig {
  taskRepository: RootAgentDeps["taskRepository"];
  noteRepository: RootAgentDeps["noteRepository"];
  goalRepository: RootAgentDeps["goalRepository"];
  model: string;
  routerModel?: string;
  apiKey: string;
}

export interface EntityCard {
  type: "task" | "note" | "goal";
  data: Record<string, unknown>;
}
