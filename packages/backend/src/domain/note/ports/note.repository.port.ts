import type { PaginatedResult, PaginationInput } from "../../shared/types.js";
import type { Note } from "../entities/note.entity.js";
import type { CreateNoteProps, NoteCategory, UpdateNoteProps } from "../types.js";

export interface NoteRepositoryPort {
  findAll(pagination?: PaginationInput): Promise<PaginatedResult<Note>>;

  findById(id: string): Promise<Note | null>;

  findByCategory(category: NoteCategory): Promise<Note[]>;

  findByTag(tag: string): Promise<Note[]>;

  search(query: string, category?: NoteCategory): Promise<Note[]>;

  create(props: CreateNoteProps): Promise<Note>;

  update(id: string, props: UpdateNoteProps): Promise<Note | null>;

  delete(id: string): Promise<boolean>;

  getAllTags(): Promise<string[]>;

  bulkUpdate(ids: string[], props: UpdateNoteProps): Promise<number>;

  bulkDelete(ids: string[]): Promise<number>;
}
