import { useState, useMemo } from "react";
import { FileText } from "lucide-react";
import { NoteKanban, NoteForm } from "../components/notes";
import { PageError, EmptyFilterState, EmptyResourceState, DeleteDialog } from "../components/feedback";
import { ResourcePageHeader, SearchInput, FilterSortBar } from "../components/shared";
import { useNotes } from "../hooks";
import { NOTE_CATEGORY_OPTIONS } from "../config";
import type { Note } from "../types";
import type { NoteFormSchema } from "../lib/validation";
import type { FilterConfig, SortOption } from "../components/shared";

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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between pb-2 px-2">
          <div>
            <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-11 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl bg-gray-50 p-3 min-h-[200px]">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <PageError resourceName="notes" message={error.message} />;

  const noteCount = notes?.length || 0;
  const filteredCount = filteredNotes?.length || 0;
  const hasActiveFilter = search !== "" || !!filterCategory;

  return (
    <div className="space-y-6 h-full overflow-y-auto p-6 pt-14 md:pt-8 md:p-8 max-w-7xl mx-auto w-full">
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
          notes={filteredNotes!}
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
    </div>
  );
}
