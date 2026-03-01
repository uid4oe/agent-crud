import { useToast } from "../app/providers/ToastProvider";
import { trpc } from "../lib/trpc";
import type { NoteFormSchema } from "../lib/validation";
import type { NoteCategory } from "../types";

function parseTags(tagsString: string): string[] {
  return tagsString.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
}

interface UseNotesOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useNotes(options: UseNotesOptions = {}) {
  const utils = trpc.useUtils();
  const { addToast } = useToast();

  const queryInput = {
    ...(options.sortBy && { sortBy: options.sortBy as "updatedAt" | "createdAt" | "title" }),
    ...(options.sortOrder && { sortOrder: options.sortOrder }),
  };

  const { data: response, isLoading, error } = trpc.note.list.useQuery(
    Object.keys(queryInput).length > 0 ? queryInput : undefined
  );

  const notes = response?.data ?? response;

  const createMutation = trpc.note.create.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
    onError: () => addToast("Failed to create note. Please try again.", "error"),
  });

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
    onError: () => addToast("Failed to update note. Please try again.", "error"),
  });

  const deleteMutation = trpc.note.delete.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
    onError: () => addToast("Failed to delete note. Please try again.", "error"),
  });

  const bulkDeleteMutation = trpc.note.bulkDelete.useMutation({
    onSuccess: () => utils.note.list.invalidate(),
    onError: () => addToast("Failed to delete notes. Please try again.", "error"),
  });

  const createNote = (data: NoteFormSchema) =>
    createMutation.mutateAsync({
      title: data.title,
      content: data.content,
      category: data.category,
      tags: parseTags(data.tags),
    });

  const updateNote = (id: string, data: NoteFormSchema) =>
    updateMutation.mutateAsync({
      id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: parseTags(data.tags),
    });

  const moveNote = (id: string, category: NoteCategory) => updateMutation.mutateAsync({ id, category });
  const deleteNote = (id: string) => deleteMutation.mutateAsync({ id });
  const bulkDeleteNotes = (ids: string[]) => bulkDeleteMutation.mutateAsync({ ids });

  return {
    notes: notes as import("../types").Note[] | undefined,
    isLoading,
    error,
    createNote,
    updateNote,
    moveNote,
    deleteNote,
    bulkDeleteNotes,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
