import { AgentIcon } from "./AgentIcon";
import { cn } from "../../lib/utils";
import { stripCardTags, extractRoutingInfo } from "../../lib/message-parser";
import type { Message } from "../../types";
import { MarkdownContent } from "./MarkdownContent";
import { LoadingDots } from "./LoadingDots";

interface MessageBubbleProps {
  msg: Message;
}

export function MessageBubble({ msg }: MessageBubbleProps) {
  const isModel = msg.role === "model";
  const displayContent = isModel && msg.isStreaming ? stripCardTags(msg.content) : msg.content;
  const plainText = isModel ? stripCardTags(msg.content) : msg.content;
  const routingAgent = isModel ? extractRoutingInfo(msg.content) : null;

  return (
    <div
      className={cn(
        "flex w-full group animate-message-in",
        msg.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {isModel && (
        <AgentIcon className="flex-shrink-0 mr-3 mt-1" />
      )}

      <div className={cn(
        "relative",
        msg.role === "user" ? "max-w-[70%]" : "max-w-[85%] flex-1"
      )}>
        <div
          className={cn(
            "px-5 py-3.5 text-[15px] leading-relaxed",
            msg.role === "user"
              ? "bg-surface text-ink rounded-[24px]"
              : "bg-transparent text-ink",
          )}
        >
          {isModel && routingAgent && !msg.isStreaming && (
            <div className="mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-light text-purple-text border border-purple">
                {routingAgent.replace("Agent", "")}
              </span>
            </div>
          )}
          {isModel ? (
            msg.content ? (
              <div className="relative">
                {msg.isStreaming ? (
                  <>
                    <MarkdownContent content={displayContent} />
                    <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse align-middle" />
                  </>
                ) : (
                  <MarkdownContent content={plainText} />
                )}
              </div>
            ) : msg.isStreaming ? (
              <LoadingDots />
            ) : (
              <p className="text-gray-400 italic">No response</p>
            )
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
