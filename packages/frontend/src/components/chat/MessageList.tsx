import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Message } from "../../types";

interface MessageListProps {
  messages: Message[] | undefined;
  isSending: boolean;
}

export function MessageList({ messages, isSending }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages?.length && !isSending) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Bot className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">How can I help you?</p>
      </div>
    );
  }

  return (
    <>
      {messages?.map((msg) => (
        <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
          {msg.role === "model" && (
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <div
            className={cn(
              "max-w-[70%] rounded-lg px-4 py-2 text-sm",
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
          {msg.role === "user" && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}
      {isSending && (
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </>
  );
}
