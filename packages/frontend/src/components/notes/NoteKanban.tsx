import { KanbanBoard } from "../shared";
import type { KanbanColumn } from "../shared";
import { NoteCard } from "./NoteCard";
import type { Note, NoteCategory } from "../../types";

const COLUMNS: KanbanColumn<NoteCategory>[] = [
  { key: "general", label: "General", emptyText: "No general notes", color: "bg-gray-50" },
  { key: "idea", label: "Ideas", emptyText: "No ideas yet", color: "bg-amber-50/50" },
  { key: "reference", label: "Reference", emptyText: "No references", color: "bg-purple-50/50" },
  { key: "meeting", label: "Meeting", emptyText: "No meeting notes", color: "bg-blue-50/50" },
  { key: "personal", label: "Personal", emptyText: "No personal notes", color: "bg-emerald-50/50" },
];

interface NoteKanbanProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onMoveToCategory?: (note: Note, newCategory: NoteCategory) => void;
}

export function NoteKanban({ notes, onEdit, onDelete, onMoveToCategory }: NoteKanbanProps) {
  return (
    <KanbanBoard
      items={notes}
      columns={COLUMNS}
      getColumnKey={(note) => note.category}
      getItemKey={(note) => note.id}
      renderItem={(note) => (
        <NoteCard
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      onItemMoved={onMoveToCategory ? (note, _from, to) => onMoveToCategory(note, to) : undefined}
    />
  );
}
