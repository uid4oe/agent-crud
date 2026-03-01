import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { NoteKanban, NoteForm } from "../notes";
import { DeleteDialog, EmptyResourceState } from "../feedback";
import { useNotes } from "../../hooks";
import type { Note } from "../../types";
import type { NoteFormSchema } from "../../lib/validation";

export function PanelNotesView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);

  const { notes, isLoading, createNote, updateNote, moveNote, deleteNote: removeNote, isCreating, isUpdating, isDeleting } = useNotes();

  const handleCreate = async (data: NoteFormSchema) => {
    await createNote(data);
    setCreateOpen(false);
  };

  const handleUpdate = async (data: NoteFormSchema) => {
    if (!editNote) return;
    await updateNote(editNote.id, data);
    setEditNote(null);
  };

  const handleDelete = async () => {
    if (!deleteNote) return;
    await removeNote(deleteNote.id);
    setDeleteNote(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm text-gray-500">{notes?.length || 0} notes</span>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-foreground bg-purple hover:bg-purple-hover rounded-full transition-all duration-200 active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {notes && notes.length > 0 ? (
          <NoteKanban
            notes={notes}
            onEdit={setEditNote}
            onDelete={setDeleteNote}
            onMoveToCategory={(note, category) => moveNote(note.id, category)}
          />
        ) : (
          <div className="px-2">
            <EmptyResourceState
              icon={FileText}
              title="No notes yet"
              description="Get started by creating your first note to keep track of your ideas and references."
              createLabel="Create Note"
              onCreateClick={() => setCreateOpen(true)}
            />
          </div>
        )}
      </div>

      <NoteForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        title="Create Note"
        isLoading={isCreating}
      />

      {editNote && (
        <NoteForm
          open={!!editNote}
          onOpenChange={(open) => !open && setEditNote(null)}
          onSubmit={handleUpdate}
          initialData={{
            title: editNote.title,
            content: editNote.content,
            category: editNote.category,
            tags: editNote.tags.join(", "),
          }}
          title="Edit Note"
          isLoading={isUpdating}
        />
      )}

      <DeleteDialog
        open={!!deleteNote}
        onClose={() => setDeleteNote(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        resourceType="Note"
        resourceName={deleteNote?.title}
      />
    </div>
  );
}
