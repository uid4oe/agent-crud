// ============================================
// Value Object
// ============================================

export const NoteCategoryValues = ["general", "idea", "reference", "meeting", "personal"] as const;

export type NoteCategory = (typeof NoteCategoryValues)[number];

// ============================================
// Entity Props
// ============================================

export interface NoteProps {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteProps {
  title: string;
  content: string;
  category?: NoteCategory;
  tags?: string[];
}

export interface UpdateNoteProps {
  title?: string;
  content?: string;
  category?: NoteCategory;
  tags?: string[];
}

// ============================================
// Service Input/Output
// ============================================

export interface ListNotesInput {
  category?: NoteCategory;
  tag?: string;
}

export interface GetNoteInput {
  id: string;
}

export type CreateNoteInput = CreateNoteProps;

export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  category?: NoteCategory;
  tags?: string[];
}

export interface DeleteNoteInput {
  id: string;
}
