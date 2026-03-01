import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn, timeAgo } from "../../lib/utils";
import type { Note } from "../../types";
import { Button } from "../ui/button";
import { CATEGORY_CONFIG } from "./note-card.data";

export interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  linkTo?: string;
  compact?: boolean;
}

export function NoteCard({ note, onEdit, onDelete, linkTo, compact }: NoteCardProps) {
  const config = CATEGORY_CONFIG[note.category] ?? CATEGORY_CONFIG.general;
  const CategoryIcon = config.icon;
  const hasActions = onEdit || onDelete;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn("rounded-xl flex-shrink-0", config.color, compact ? "p-1.5" : "p-2")}>
          <CategoryIcon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </div>
        <div className="flex items-center gap-1">
          {hasActions && (
            <div className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200",
            )}>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit note"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(note); }}
                  className={cn(
                    "text-gray-500 hover:bg-surface hover:text-gray-900 rounded-full",
                    compact ? "h-7 w-7" : "h-8 w-8"
                  )}
                >
                  <Pencil className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete note"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(note); }}
                  className={cn(
                    "text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full",
                    compact ? "h-7 w-7" : "h-8 w-8"
                  )}
                >
                  <Trash2 className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </Button>
              )}
            </div>
          )}
          {linkTo && !hasActions && (
            <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover/card:text-gray-400 shrink-0 transition-all duration-150" />
          )}
        </div>
      </div>

      <h3 className={cn(
        "font-semibold text-ink leading-snug",
        compact ? "text-sm mb-1" : "text-[15px] mb-1.5"
      )}>
        {note.title}
      </h3>

      <p className={cn(
        "leading-relaxed text-ink-secondary whitespace-pre-wrap flex-1",
        compact ? "text-xs line-clamp-2 mb-2.5" : "text-[13px] mb-4"
      )}>
        {note.content || "Empty note"}
      </p>

      <div className={cn(
        "flex items-end justify-between gap-2 mt-auto pt-2 border-t border-gray-50",
        compact && "items-center"
      )}>
        <div className={cn(compact ? "flex items-center gap-2" : "flex flex-col gap-0.5")}>
          {compact && (
            <div className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">
              {config.label}
            </div>
          )}
          <div className="text-[11px] text-gray-400">
            {timeAgo(note.updatedAt || note.createdAt)}
          </div>
        </div>

        {note.tags && note.tags.length > 0 && (
          <div className={cn("flex gap-1.5 flex-wrap", !compact && "justify-end")}>
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-medium bg-surface text-gray-600 rounded-full text-[11px] px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="font-medium text-gray-400 text-[11px] px-1 py-0.5">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const className = cn(
    "group group/card relative flex flex-col transition-all duration-200 border",
    compact
      ? "p-3.5 rounded-2xl bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-w-md"
      : "p-5 rounded-2xl bg-white border-gray-200 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] break-inside-avoid"
  );

  if (linkTo) {
    return <Link to={linkTo} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
