import { FunctionTool } from "@google/adk";
import { z } from "zod";
import type { NoteRepositoryPort, NoteCategory } from "../../../../domain/index.js";
import { params, safeExecute, type ToolArgs } from "./tool-helpers.js";

export function createNoteTools(
  noteRepository: NoteRepositoryPort
): FunctionTool[] {
  const listNotes = new FunctionTool({
    name: "list_notes",
    description: "List all notes, optionally filtered by category or tag",
    parameters: params(
      z.object({
        category: z
          .enum(["general", "idea", "reference", "meeting", "personal"])
          .optional()
          .describe(
            "Optional filter by category: general, idea, reference, meeting, or personal"
          ),
        tag: z.string().optional().describe("Optional filter by tag"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { category, tag } = args as {
        category?: NoteCategory;
        tag?: string;
      };

      let notes;
      if (category) {
        notes = await noteRepository.findByCategory(category);
      } else if (tag) {
        notes = await noteRepository.findByTag(tag);
      } else {
        const result = await noteRepository.findAll();
        notes = result.data;
      }

      if (notes.length === 0) {
        if (category) {
          return `No notes found with category "${category}"`;
        } else if (tag) {
          return `No notes found with tag "${tag}"`;
        }
        return "No notes found in the system";
      }

      return JSON.stringify(
        notes.map((n) => n.toJSON()),
        null,
        2
      );
    }),
  });

  const getNoteById = new FunctionTool({
    name: "get_note_by_id",
    description: "Get a specific note by its ID to view full details",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the note to retrieve"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id } = args as { id: string };
      const note = await noteRepository.findById(id);
      if (!note) {
        return `Note with ID "${id}" not found`;
      }
      return JSON.stringify(note.toJSON(), null, 2);
    }),
  });

  const searchNotes = new FunctionTool({
    name: "search_notes",
    description: "Search notes by keyword in title or content",
    parameters: params(
      z.object({
        query: z
          .string()
          .describe("Search term to find in note title or content"),
        category: z
          .enum(["general", "idea", "reference", "meeting", "personal"])
          .optional()
          .describe(
            "Optional filter by category: general, idea, reference, meeting, or personal"
          ),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { query, category } = args as {
        query: string;
        category?: NoteCategory;
      };
      const notes = await noteRepository.search(query, category);

      if (notes.length === 0) {
        return `No notes found matching "${query}"${category ? ` with category "${category}"` : ""}`;
      }

      return JSON.stringify(
        notes.map((n) => n.toJSON()),
        null,
        2
      );
    }),
  });

  const getNoteStatistics = new FunctionTool({
    name: "get_note_statistics",
    description:
      "Get statistics about notes: total count, counts by category, and all tags",
    parameters: params(z.object({})),
    execute: safeExecute(async () => {
      const result = await noteRepository.findAll();
      const allNotes = result.data;
      const allTags = await noteRepository.getAllTags();

      const stats = {
        total: allNotes.length,
        byCategory: {
          general: allNotes.filter((n) => n.category === "general").length,
          idea: allNotes.filter((n) => n.category === "idea").length,
          reference: allNotes.filter((n) => n.category === "reference").length,
          meeting: allNotes.filter((n) => n.category === "meeting").length,
          personal: allNotes.filter((n) => n.category === "personal").length,
        },
        allTags,
        recentNotes: [...allNotes]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map((n) => ({
            title: n.title,
            category: n.category,
            tags: n.tags,
            createdAt: n.createdAt,
          })),
      };

      return JSON.stringify(stats, null, 2);
    }),
  });

  const createNote = new FunctionTool({
    name: "create_note",
    description: "Create a new note",
    parameters: params(
      z.object({
        title: z.string().describe("The title of the note"),
        content: z.string().describe("The content/body of the note"),
        category: z
          .enum(["general", "idea", "reference", "meeting", "personal"])
          .optional()
          .describe(
            "Category of the note: general, idea, reference, meeting, or personal (defaults to general)"
          ),
        tags: z
          .array(z.string())
          .optional()
          .describe("Optional list of tags for the note"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { title, content, category, tags } = args as {
        title: string;
        content: string;
        category?: string;
        tags?: string[];
      };
      const note = await noteRepository.create({
        title,
        content,
        category: (category as NoteCategory) || "general",
        tags: tags || [],
      });
      return JSON.stringify(note.toJSON(), null, 2);
    }),
  });

  const updateNote = new FunctionTool({
    name: "update_note",
    description: "Update an existing note",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the note to update"),
        title: z.string().optional().describe("New title for the note"),
        content: z.string().optional().describe("New content for the note"),
        category: z
          .enum(["general", "idea", "reference", "meeting", "personal"])
          .optional()
          .describe(
            "New category: general, idea, reference, meeting, or personal"
          ),
        tags: z
          .array(z.string())
          .optional()
          .describe("New list of tags (replaces existing tags)"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id, title, content, category, tags } = args as {
        id: string;
        title?: string;
        content?: string;
        category?: string;
        tags?: string[];
      };
      const updateProps: {
        title?: string;
        content?: string;
        category?: NoteCategory;
        tags?: string[];
      } = {};

      if (title) updateProps.title = title;
      if (content !== undefined) updateProps.content = content;
      if (category) updateProps.category = category as NoteCategory;
      if (tags) updateProps.tags = tags;

      const updated = await noteRepository.update(id, updateProps);
      return updated
        ? JSON.stringify(updated.toJSON(), null, 2)
        : `Note with ID "${id}" not found`;
    }),
  });

  const deleteNote = new FunctionTool({
    name: "delete_note",
    description: "Delete a note by ID",
    parameters: params(
      z.object({
        id: z.string().describe("The UUID of the note to delete"),
      })
    ),
    execute: safeExecute(async (args: ToolArgs) => {
      const { id } = args as { id: string };
      const note = await noteRepository.findById(id);
      if (!note) {
        return `Note with ID "${id}" not found`;
      }

      await noteRepository.delete(id);
      return `Note "${note.title}" (${id}) deleted successfully`;
    }),
  });

  const getAllTags = new FunctionTool({
    name: "get_all_tags",
    description:
      "Get a list of all unique tags used across all notes",
    parameters: params(z.object({})),
    execute: safeExecute(async () => {
      const tags = await noteRepository.getAllTags();
      if (tags.length === 0) {
        return "No tags found. Notes don't have any tags yet.";
      }
      return JSON.stringify({ tags, count: tags.length }, null, 2);
    }),
  });

  return [
    listNotes,
    getNoteById,
    searchNotes,
    getNoteStatistics,
    createNote,
    updateNote,
    deleteNote,
    getAllTags,
  ];
}
