import type { Note } from "./entities/note.entity.js";
import type { NoteRepositoryPort } from "./ports/note.repository.port.js";
import { NoteNotFoundError, NoteTitleRequiredError } from "../shared/index.js";
import type { PaginationInput, PaginatedResult } from "../shared/types.js";
import type {
  NoteCategory,
  ListNotesInput,
  GetNoteInput,
  CreateNoteInput,
  UpdateNoteInput,
  DeleteNoteInput,
} from "./types.js";

export class NoteService {
  constructor(private readonly noteRepository: NoteRepositoryPort) {}

  async list(input: ListNotesInput = {}, pagination?: PaginationInput): Promise<PaginatedResult<Note>> {
    if (input.category) {
      const data = await this.noteRepository.findByCategory(input.category);
      return { data, total: data.length, limit: data.length, offset: 0 };
    }
    if (input.tag) {
      const data = await this.noteRepository.findByTag(input.tag);
      return { data, total: data.length, limit: data.length, offset: 0 };
    }
    return this.noteRepository.findAll(pagination);
  }

  async get(input: GetNoteInput): Promise<Note> {
    const note = await this.noteRepository.findById(input.id);
    if (!note) {
      throw new NoteNotFoundError(input.id);
    }
    return note;
  }

  async findById(id: string): Promise<Note | null> {
    return this.noteRepository.findById(id);
  }

  async create(input: CreateNoteInput): Promise<Note> {
    if (!input.title || input.title.trim().length === 0) {
      throw new NoteTitleRequiredError();
    }

    return this.noteRepository.create({
      title: input.title.trim(),
      content: input.content ?? "",
      category: input.category ?? "general",
      tags: input.tags ?? [],
    });
  }

  async update(input: UpdateNoteInput): Promise<Note> {
    const existingNote = await this.noteRepository.findById(input.id);
    if (!existingNote) {
      throw new NoteNotFoundError(input.id);
    }

    const updateProps: {
      title?: string;
      content?: string;
      category?: NoteCategory;
      tags?: string[];
    } = {};

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new NoteTitleRequiredError();
      }
      updateProps.title = input.title.trim();
    }

    if (input.content !== undefined) {
      updateProps.content = input.content;
    }

    if (input.category !== undefined) {
      updateProps.category = input.category;
    }

    if (input.tags !== undefined) {
      updateProps.tags = input.tags;
    }

    const note = await this.noteRepository.update(input.id, updateProps);
    if (!note) {
      throw new NoteNotFoundError(input.id);
    }

    return note;
  }

  async delete(input: DeleteNoteInput): Promise<boolean> {
    const existingNote = await this.noteRepository.findById(input.id);
    if (!existingNote) {
      throw new NoteNotFoundError(input.id);
    }

    return this.noteRepository.delete(input.id);
  }

  async search(query: string, category?: NoteCategory): Promise<Note[]> {
    return this.noteRepository.search(query, category);
  }

  async getAllTags(): Promise<string[]> {
    return this.noteRepository.getAllTags();
  }

  async bulkUpdate(ids: string[], props: { category?: NoteCategory }): Promise<number> {
    return this.noteRepository.bulkUpdate(ids, props);
  }

  async bulkDelete(ids: string[]): Promise<number> {
    return this.noteRepository.bulkDelete(ids);
  }
}
