import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import { AgentIcon } from "./AgentIcon";
import { LoadingDots } from "./LoadingDots";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[] | undefined;
  isSending: boolean;
}

export function MessageList({ messages, isSending }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  if (!messages?.length && !isSending) {
    return null;
  }

  const hasStreamingMessage = messages?.some((msg) => msg.isStreaming);

  return (
    <div className="space-y-8 flex flex-col w-full py-2">
      {messages?.map((msg) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
        />
      ))}

      {isSending && !hasStreamingMessage && (
        <div className="flex justify-start w-full group animate-message-in">
          <AgentIcon className="flex-shrink-0 mr-3 mt-1" pulse />
          <div className="px-5 py-3 bg-transparent">
            <LoadingDots />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
