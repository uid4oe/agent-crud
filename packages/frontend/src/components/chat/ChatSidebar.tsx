import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { Conversation } from "../../types";

interface ChatSidebarProps {
  conversations: Conversation[] | undefined;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, isCreating }: ChatSidebarProps) {
  return (
    <div className="w-64 border-r flex flex-col">
      <div className="p-3 border-b">
        <Button onClick={onNew} className="w-full" size="sm" disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {!conversations?.length ? (
          <p className="text-xs text-muted-foreground text-center py-4">No conversations</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm group",
                  activeId === conv.id ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">{conv.title || "New Chat"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
