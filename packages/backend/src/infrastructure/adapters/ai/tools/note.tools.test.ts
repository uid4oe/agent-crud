import type { FunctionTool } from "@google/adk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Note } from "../../../../domain/note/entities/note.entity.js";
import type { NoteRepositoryPort } from "../../../../domain/note/ports/note.repository.port.js";
import type { NoteProps } from "../../../../domain/note/types.js";
import { createNoteTools } from "./note.tools.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-01-15T12:00:00Z");

function makeNote(overrides: Partial<NoteProps> = {}): Note {
  return Note.reconstitute({
    id: "n-1",
    title: "Meeting Notes",
    content: "Discussed roadmap",
    category: "meeting",
    tags: ["work"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function mockRepo(): NoteRepositoryPort {
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

interface TestTool { name: string; execute: (args: Record<string, unknown>) => Promise<string> }

function toTestTools(adkTools: FunctionTool[]): TestTool[] {
  return adkTools.map((t) => ({
    name: t.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing private execute for testing
    execute: (t as any).execute.bind(t) as TestTool["execute"],
  }));
}

function getTool(tools: TestTool[], name: string): TestTool {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Note AI tools", () => {
  let repo: ReturnType<typeof mockRepo>;
  let tools: TestTool[];

  beforeEach(() => {
    repo = mockRepo();
    tools = toTestTools(createNoteTools(repo));
  });

  it("creates 8 tools", () => {
    expect(tools).toHaveLength(8);
    const names = tools.map((t) => t.name);
    expect(names).toContain("list_notes");
    expect(names).toContain("get_note_by_id");
    expect(names).toContain("search_notes");
    expect(names).toContain("get_note_statistics");
    expect(names).toContain("create_note");
    expect(names).toContain("update_note");
    expect(names).toContain("delete_note");
    expect(names).toContain("get_all_tags");
  });

  describe("list_notes", () => {
    it("returns all notes as JSON", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [makeNote()],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const result = await getTool(tools, "list_notes").execute({});
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe("Meeting Notes");
    });

    it("filters by category when provided", async () => {
      vi.mocked(repo.findByCategory).mockResolvedValue([makeNote({ category: "idea" })]);

      const result = await getTool(tools, "list_notes").execute({ category: "idea" });
      const parsed = JSON.parse(result);

      expect(repo.findByCategory).toHaveBeenCalledWith("idea");
      expect(parsed[0].category).toBe("idea");
    });

    it("filters by tag when provided", async () => {
      vi.mocked(repo.findByTag).mockResolvedValue([makeNote({ tags: ["urgent"] })]);

      const result = await getTool(tools, "list_notes").execute({ tag: "urgent" });
      const parsed = JSON.parse(result);

      expect(repo.findByTag).toHaveBeenCalledWith("urgent");
      expect(parsed[0].tags).toContain("urgent");
    });

    it("returns message when no notes found", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0 });

      const result = await getTool(tools, "list_notes").execute({});
      expect(result).toContain("No notes found");
    });

    it("returns category-specific message when filtered and empty", async () => {
      vi.mocked(repo.findByCategory).mockResolvedValue([]);

      const result = await getTool(tools, "list_notes").execute({ category: "idea" });
      expect(result).toContain("idea");
    });

    it("returns tag-specific message when filtered and empty", async () => {
      vi.mocked(repo.findByTag).mockResolvedValue([]);

      const result = await getTool(tools, "list_notes").execute({ tag: "nonexistent" });
      expect(result).toContain("nonexistent");
    });
  });

  describe("get_note_by_id", () => {
    it("returns note JSON when found", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeNote());

      const result = await getTool(tools, "get_note_by_id").execute({ id: "n-1" });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe("n-1");
      expect(parsed.title).toBe("Meeting Notes");
    });

    it("returns not-found message when missing", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const result = await getTool(tools, "get_note_by_id").execute({ id: "missing" });
      expect(result).toContain("not found");
    });
  });

  describe("search_notes", () => {
    it("returns matching notes", async () => {
      vi.mocked(repo.search).mockResolvedValue([makeNote()]);

      const result = await getTool(tools, "search_notes").execute({ query: "roadmap" });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(1);
      expect(repo.search).toHaveBeenCalledWith("roadmap", undefined);
    });

    it("passes category filter to search", async () => {
      vi.mocked(repo.search).mockResolvedValue([makeNote()]);

      await getTool(tools, "search_notes").execute({ query: "roadmap", category: "meeting" });
      expect(repo.search).toHaveBeenCalledWith("roadmap", "meeting");
    });

    it("returns message when no matches", async () => {
      vi.mocked(repo.search).mockResolvedValue([]);

      const result = await getTool(tools, "search_notes").execute({ query: "xyz" });
      expect(result).toContain('No notes found matching "xyz"');
    });
  });

  describe("get_note_statistics", () => {
    it("computes counts by category and includes tags", async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [
          makeNote({ id: "1", category: "meeting" }),
          makeNote({ id: "2", category: "idea" }),
          makeNote({ id: "3", category: "meeting" }),
        ],
        total: 3,
        limit: 50,
        offset: 0,
      });
      vi.mocked(repo.getAllTags).mockResolvedValue(["work", "urgent"]);

      const result = await getTool(tools, "get_note_statistics").execute({});
      const stats = JSON.parse(result);

      expect(stats.total).toBe(3);
      expect(stats.byCategory.meeting).toBe(2);
      expect(stats.byCategory.idea).toBe(1);
      expect(stats.allTags).toEqual(["work", "urgent"]);
    });
  });

  describe("create_note", () => {
    it("creates a note and returns JSON", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeNote());

      const result = await getTool(tools, "create_note").execute({
        title: "Meeting Notes",
        content: "Discussed roadmap",
        category: "meeting",
        tags: ["work"],
      });
      const parsed = JSON.parse(result);

      expect(parsed.title).toBe("Meeting Notes");
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Meeting Notes", content: "Discussed roadmap" })
      );
    });

    it("defaults category to general when not provided", async () => {
      vi.mocked(repo.create).mockResolvedValue(makeNote({ category: "general" }));

      await getTool(tools, "create_note").execute({
        title: "Quick note",
        content: "Some content",
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ category: "general" })
      );
    });
  });

  describe("update_note", () => {
    it("updates and returns JSON", async () => {
      vi.mocked(repo.update).mockResolvedValue(makeNote({ title: "Updated Title" }));

      const result = await getTool(tools, "update_note").execute({
        id: "n-1",
        title: "Updated Title",
      });
      const parsed = JSON.parse(result);

      expect(parsed.title).toBe("Updated Title");
    });

    it("returns not-found when update returns null", async () => {
      vi.mocked(repo.update).mockResolvedValue(null);

      const result = await getTool(tools, "update_note").execute({ id: "x", title: "Y" });
      expect(result).toContain("not found");
    });
  });

  describe("delete_note", () => {
    it("deletes and returns success message", async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeNote());
      vi.mocked(repo.delete).mockResolvedValue(true);

      const result = await getTool(tools, "delete_note").execute({ id: "n-1" });
      expect(result).toContain("deleted successfully");
      expect(result).toContain("Meeting Notes");
    });

    it("returns not-found when note doesn't exist", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const result = await getTool(tools, "delete_note").execute({ id: "x" });
      expect(result).toContain("not found");
    });
  });

  describe("get_all_tags", () => {
    it("returns all tags with count", async () => {
      vi.mocked(repo.getAllTags).mockResolvedValue(["work", "urgent", "ideas"]);

      const result = await getTool(tools, "get_all_tags").execute({});
      const parsed = JSON.parse(result);

      expect(parsed.tags).toEqual(["work", "urgent", "ideas"]);
      expect(parsed.count).toBe(3);
    });

    it("returns message when no tags found", async () => {
      vi.mocked(repo.getAllTags).mockResolvedValue([]);

      const result = await getTool(tools, "get_all_tags").execute({});
      expect(result).toContain("No tags found");
    });
  });
});
