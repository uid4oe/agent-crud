import { Apple, Brain, Dumbbell, Moon, MoreHorizontal } from "lucide-react";
import type { GoalCategory } from "../../types";

export const CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: typeof Dumbbell; color: string }> = {
  fitness: { label: "Fitness", icon: Dumbbell, color: "bg-orange-50 text-orange-700" },
  nutrition: { label: "Nutrition", icon: Apple, color: "bg-green-50 text-green-700" },
  mindfulness: { label: "Mindfulness", icon: Brain, color: "bg-purple-50 text-purple-700" },
  sleep: { label: "Sleep", icon: Moon, color: "bg-indigo-50 text-indigo-700" },
  other: { label: "Other", icon: MoreHorizontal, color: "bg-gray-100 text-gray-700" },
};
