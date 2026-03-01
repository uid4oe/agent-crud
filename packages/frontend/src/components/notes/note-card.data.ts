import { BookOpen, FileText, Lightbulb, User, Users } from "lucide-react";
import type { NoteCategory } from "../../types";

export const CATEGORY_CONFIG: Record<NoteCategory, { label: string; icon: typeof FileText; color: string }> = {
  general: { label: "General", icon: FileText, color: "bg-gray-100 text-gray-700" },
  idea: { label: "Idea", icon: Lightbulb, color: "bg-amber-50 text-amber-700" },
  reference: { label: "Reference", icon: BookOpen, color: "bg-purple-50 text-purple-700" },
  meeting: { label: "Meeting", icon: Users, color: "bg-blue-50 text-blue-700" },
  personal: { label: "Personal", icon: User, color: "bg-emerald-50 text-emerald-700" },
};
