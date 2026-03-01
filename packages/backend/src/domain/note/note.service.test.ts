import { describe, it, expect, beforeEach, vi } from "vitest";
import { NoteService } from "./note.service.js";
import type { NoteRepositoryPort } from "./ports/note.repository.port.js";
import { Note } from "./entities/note.entity.js";
import { NoteNotFoundError, NoteTitleRequiredError } from "../shared/errors/index.js";
import type { NoteProps } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeNoteProps(overrides: Partial<NoteProps> = {}): NoteProps {
  return {
    id: "note-1",
    title: "Meeting notes",
    content: "Discussed Q1 targets",
    category: "meeting",
    tags: ["work"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeNote(overrides: Partial<NoteProps> = {}): Note {
  return Note.reconstitute(makeNoteProps(overrides));
}

function createMockRepository(): NoteRepositoryPort {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCategory: vi.fn(),
    findByTag: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAllTags: vi.fn(),
    bulkUpdate: vi.fn(),
    bulkDelete: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Service Tests
// ---------------------------------------------------------------------------

describe("NoteService", () => {
  let service: NoteService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repo = createMockRepository();
    service = new NoteService(repo);
  });

  describe("list", () => {
    it("returns all notes without filters", async () => {
      const paginated = { data: [makeNote()], total: 1, limit: 50, offset: 0 };
      vi.mocked(repo.findAll).mockResolvedValue(paginated);

      const result = await service.list();

      expect(repo.findAll).toHaveBeenCalled();
      expect(result.total).toBe(1);
    });

    it("filters by category", async () => {
      vi.mocked(repo.findByCategory).mockResolvedValue([makeNote()]);

      const result = await service.list({ category: "meeting" });

      expect(repo.findByCategory).toHaveBeenCalledWith("meeting");
      expect(result.data).toHaveLength(1);
    });

    it("filters by tag", async () => {
      vi.mocked(repo.findByTag).mockResolvedValue([makeNote()]);

      const result = await service.list({ tag: "work" });

      expect(repo.findByTag).toHaveBeenCalledWith("work");
      expect(result.data).toHaveLength(1);
    });

    it("prefers category filter over tag filter", async () => {
      vi.mocked(repo.findByCategory).mockResolvedValue([]);

      await service.list({ category: "meeting", tag: "work" });

      expect(repo.findByCategory).toHaveBeenCalled();
      expect(repo.findByTag).not.toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("returns note when found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeNote());

      const result = await service.get({ id: "note-1" });
      expect(result.title).toBe("Meeting notes");
    });

    it("throws NoteNotFoundError when not found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.get({ id: "missing" })).rejects.toThrow(NoteNotFoundError);
    });
  });

  describe("create", () => {
    it("creates with defaults", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeNote({ category: "general" }));

      await service.create({ title: "Quick note", content: "" });

      expect(vi.mocked(repo.create).mock.calls[0][0]).toMatchObject({
        title: "Quick note",
        content: "",
        category: "general",
        tags: [],
      });
    });

    it("trims the title", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeNote());

      await service.create({ title: "  Trimmed  ", content: "" });

      expect(vi.mocked(repo.create).mock.calls[0][0].title).toBe("Trimmed");
    });

    it("rejects empty title", async () => {
      await expect(service.create({ title: "", content: "" })).rejects.toThrow(
        NoteTitleRequiredError
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("passes category and tags through", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeNote());

      await service.create({
        title: "Idea",
        category: "idea",
        tags: ["brainstorm"],
        content: "What if...",
      });

      expect(vi.mocked(repo.create).mock.calls[0][0]).toMatchObject({
        category: "idea",
        tags: ["brainstorm"],
        content: "What if...",
      });
    });
  });

  describe("update", () => {
    it("updates when note exists", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeNote());
      vi.mocked(repo.update).mockResolvedValue(makeNote({ content: "Updated" }));

      const result = await service.update({ id: "note-1", content: "Updated" });

      expect(result.content).toBe("Updated");
    });

    it("throws NoteNotFoundError if not found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.update({ id: "x", title: "X" })).rejects.toThrow(NoteNotFoundError);
    });

    it("rejects empty title update", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeNote());
      await expect(service.update({ id: "note-1", title: "" })).rejects.toThrow(
        NoteTitleRequiredError
      );
    });

    it("only sends provided fields", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeNote());
      vi.mocked(repo.update).mockResolvedValue(makeNote());

      await service.update({ id: "note-1", category: "idea" });

      expect(vi.mocked(repo.update).mock.calls[0][1]).toEqual({ category: "idea" });
    });
  });

  describe("delete", () => {
    it("deletes an existing note", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeNote());
      vi.mocked(repo.delete).mockResolvedValue(true);

      const result = await service.delete({ id: "note-1" });
      expect(result).toBe(true);
    });

    it("throws NoteNotFoundError if not found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.delete({ id: "x" })).rejects.toThrow(NoteNotFoundError);
    });
  });

  describe("search", () => {
    it("searches with query and optional category", async () => {
      vi.mocked(repo.search).mockResolvedValue([makeNote()]);

      await service.search("meeting", "meeting");

      expect(repo.search).toHaveBeenCalledWith("meeting", "meeting");
    });
  });

  describe("getAllTags", () => {
    it("returns tags from repository", async () => {
      vi.mocked(repo.getAllTags).mockResolvedValue(["work", "personal"]);

      const tags = await service.getAllTags();
      expect(tags).toEqual(["work", "personal"]);
    });
  });
});

// ---------------------------------------------------------------------------
// Entity Tests
// ---------------------------------------------------------------------------

describe("Note entity", () => {
  const props = (): NoteProps => ({
    id: "n-1",
    title: "Test",
    content: "Content",
    category: "general",
    tags: ["a"],
    createdAt: now,
    updatedAt: now,
  });

  it("creates with validation", () => {
    const note = Note.create(props());
    expect(note.title).toBe("Test");
  });

  it("rejects empty title", () => {
    expect(() => Note.create({ ...props(), title: "" })).toThrow(NoteTitleRequiredError);
  });

  it("rejects invalid category", () => {
    expect(() => Note.create({ ...props(), category: "bad" as never })).toThrow();
  });

  it("addTag is idempotent", () => {
    const note = Note.create(props());
    const same = note.addTag("a");
    expect(same).toBe(note); // same reference, tag already exists
  });

  it("addTag appends new tag", () => {
    const note = Note.create(props());
    const updated = note.addTag("b");
    expect(updated.tags).toEqual(["a", "b"]);
    expect(note.tags).toEqual(["a"]); // original unchanged
  });

  it("removeTag filters out tag", () => {
    const note = Note.create(props());
    const updated = note.removeTag("a");
    expect(updated.tags).toEqual([]);
  });

  it("returns defensive copy of tags", () => {
    const note = Note.create(props());
    note.tags.push("mutated");
    expect(note.tags).toEqual(["a"]);
  });
});
