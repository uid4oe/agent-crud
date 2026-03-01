import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteDialog, EmptyFilterState, EmptyResourceState } from "../components/feedback";
import { NoteForm, NoteKanban } from "../components/notes";
import type { FilterConfig, SortOption } from "../components/shared";
import { FilterSortBar, ResourcePageHeader, ResourcePageLayout, SearchInput } from "../components/shared";
import { NOTE_CATEGORY_OPTIONS } from "../config";
import { useNotes } from "../hooks";
import type { NoteFormSchema } from "../lib/validation";
import type { Note } from "../types";

const NOTE_FILTERS: FilterConfig[] = [
  {
    key: "category",
    label: "All Categories",
    options: NOTE_CATEGORY_OPTIONS,
  },
];

const NOTE_SORT_OPTIONS: SortOption[] = [
  { value: "updatedAt", label: "Recently Updated" },
  { value: "createdAt", label: "Recently Created" },
  { value: "title", label: "Title" },
];

export function NotesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { notes, isLoading, error, createNote, updateNote, moveNote, deleteNote: removeNote, isCreating, isUpdating, isDeleting } = useNotes({ sortBy, sortOrder });

  const filteredNotes = useMemo(() => {
    if (!notes) return undefined;
    let result = notes;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filterCategory) {
      result = result.filter((note) => note.category === filterCategory);
    }

    return result;
  }, [notes, search, filterCategory]);

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

  const noteCount = notes?.length || 0;
  const filteredCount = filteredNotes?.length || 0;
  const hasActiveFilter = search !== "" || !!filterCategory;

  return (
    <ResourcePageLayout
      isLoading={isLoading}
      error={error}
      resourceName="notes"
      skeletonColumns={5}
    >
      <ResourcePageHeader
        title="Notes"
        noun="note"
        totalCount={noteCount}
        filteredCount={filteredCount}
        hasActiveFilter={hasActiveFilter}
        createLabel="New Note"
        onCreate={() => setCreateOpen(true)}
      />

      {noteCount > 0 && (
        <div className="px-2 space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search notes, tags..." />
          <FilterSortBar
            filters={NOTE_FILTERS}
            activeFilters={{ category: filterCategory }}
            onFilterChange={(key, value) => {
              if (key === "category") setFilterCategory(value);
            }}
            sortOptions={NOTE_SORT_OPTIONS}
            activeSort={sortBy}
            sortOrder={sortOrder}
            onSortChange={(s, o) => { setSortBy(s); setSortOrder(o); }}
          />
        </div>
      )}

      {!notes?.length ? (
        <EmptyResourceState
          icon={FileText}
          title="No notes yet"
          description="Get started by creating your first note to keep track of your ideas and references."
          createLabel="Create Note"
          onCreateClick={() => setCreateOpen(true)}
        />
      ) : filteredNotes && filteredNotes.length === 0 ? (
        <EmptyFilterState onClear={() => { setSearch(""); setFilterCategory(undefined); }} />
      ) : (
        <NoteKanban
          notes={filteredNotes ?? []}
          onEdit={setEditNote}
          onDelete={setDeleteNote}
          onMoveToCategory={(note, category) => moveNote(note.id, category)}
        />
      )}

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
    </ResourcePageLayout>
  );
}
