import { z } from "zod";
import { NOTE_CATEGORIES } from "../../config";
import type { NoteCategory } from "../../types";

const NOTE_CATEGORY_VALUES = Object.values(NOTE_CATEGORIES) as [NoteCategory, ...NoteCategory[]];

export const noteFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  content: z
    .string()
    .max(10000, "Content must be 10,000 characters or less"),
  category: z.enum(NOTE_CATEGORY_VALUES),
  tags: z.string().max(200, "Tags must be 200 characters or less"),
});

export type NoteFormSchema = z.infer<typeof noteFormSchema>;
