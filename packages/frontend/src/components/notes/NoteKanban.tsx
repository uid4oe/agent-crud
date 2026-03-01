import type { Note, NoteCategory } from "../../types";
import { KanbanBoard } from "../shared";
import { NoteCard } from "./NoteCard";
import { COLUMNS } from "./note-kanban.data";

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
      layout="rows"
    />
  );
}
