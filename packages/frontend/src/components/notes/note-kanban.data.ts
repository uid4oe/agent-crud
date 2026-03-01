import type { NoteCategory } from "../../types";
import type { KanbanColumn } from "../shared";

export const COLUMNS: KanbanColumn<NoteCategory>[] = [
  { key: "general", label: "General", emptyText: "No general notes", color: "bg-gray-50" },
  { key: "idea", label: "Ideas", emptyText: "No ideas yet", color: "bg-amber-50/50" },
  { key: "reference", label: "Reference", emptyText: "No references", color: "bg-purple-50/50" },
  { key: "meeting", label: "Meeting", emptyText: "No meeting notes", color: "bg-blue-50/50" },
  { key: "personal", label: "Personal", emptyText: "No personal notes", color: "bg-emerald-50/50" },
];
