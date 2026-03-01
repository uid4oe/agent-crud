import { useMemo, useRef, useState } from "react";
import { trpc } from "../lib/trpc";
import type { Message } from "../types";

interface UseChatStreamOptions {
  onComplete: (conversationId: string, finalContent: string) => void;
  onError?: (error: Error) => void;
}

interface StreamInput {
  conversationId: string;
  message: string;
}

export function useChatStream({ onComplete, onError: onErrorCallback }: UseChatStreamOptions) {
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingInput, setStreamingInput] = useState<StreamInput | null>(null);
  const contentRef = useRef("");

  trpc.agent.chatStream.useSubscription(streamingInput!, {
    enabled: !!streamingInput,
    onData: (data: { text: string; done: boolean; conversationId: string }) => {
      if (data.text) {
        contentRef.current += data.text;
        setStreamingContent(contentRef.current);
      }

      if (data.done) {
        const finalContent = contentRef.current;
        contentRef.current = "";
        setStreamingContent("");
        setIsStreaming(false);
        setStreamingInput(null);
        onComplete(data.conversationId, finalContent);
      }
    },
    onError: (error) => {
      console.error("Streaming error:", error);
      setStreamingContent("");
      setIsStreaming(false);
      setStreamingInput(null);
      onErrorCallback?.(error instanceof Error ? error : new Error(String(error)));
    },
  });

  const startStream = (input: StreamInput) => {
    contentRef.current = "";
    setIsStreaming(true);
    setStreamingContent("");
    setStreamingInput(input);
  };

  const streamingMessage: Message | null = useMemo(() => {
    if (!isStreaming) return null;
    return {
      id: streamingContent ? "streaming-active" : "streaming-loading",
      role: "model" as const,
      content: streamingContent,
      createdAt: new Date(0).toISOString(),
      isStreaming: true,
    };
  }, [isStreaming, streamingContent]);

  return {
    streamingContent,
    isStreaming,
    startStream,
    streamingMessage,
  };
}
