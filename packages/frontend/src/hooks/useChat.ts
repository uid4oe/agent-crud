import { useState, useCallback, useRef, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { useChatStream } from "./useChatStream";
import { useToast } from "../app/providers/ToastProvider";
import { parseMessageContent } from "../lib/message-parser";
import type { Message } from "../types";

export type DetectedDomain = "tasks" | "notes" | "goals";

const CARD_TYPE_TO_DOMAIN: Record<string, DetectedDomain> = {
  "task-card": "tasks",
  "note-card": "notes",
  "goal-card": "goals",
};

export function detectDomainFromContent(content: string): DetectedDomain | null {
  const segments = parseMessageContent(content);
  for (const seg of segments) {
    if (seg.type !== "text") {
      return CARD_TYPE_TO_DOMAIN[seg.type] ?? null;
    }
  }
  return null;
}

interface ChatOptions {
  onConversationChange?: (id: string | null) => void;
  initialConversationId?: string | null;
  useStreaming?: boolean;
  onEntitiesDetected?: (domain: DetectedDomain) => void;
}

export function useChat(options: ChatOptions = {}) {
  const { onConversationChange, initialConversationId, useStreaming = true, onEntitiesDetected } = options;

  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<string | null>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const utils = trpc.useUtils();
  const { addToast } = useToast();

  // Clear pendingConversationId once the URL has caught up
  if (pendingConversationId && initialConversationId === pendingConversationId) {
    setPendingConversationId(null);
  }

  const activeConversationId = pendingConversationId ?? initialConversationId ?? null;

  const setActiveConversationId = useCallback(
    (id: string | null) => {
      setPendingConversationId(id);
      onConversationChange?.(id);
    },
    [onConversationChange]
  );

  const { isStreaming, streamingMessage, startStream } = useChatStream({
    onComplete: (conversationId, finalContent) => {
      setOptimisticUserMessage(null);
      utils.agent.getMessages.invalidate({ conversationId });
      utils.agent.listConversations.invalidate();
      utils.task.list.invalidate();
      utils.note.list.invalidate();
      utils.goal.list.invalidate();

      if (finalContent && onEntitiesDetected) {
        const domain = detectDomainFromContent(finalContent);
        if (domain) onEntitiesDetected(domain);
      }
    },
    onError: () => {
      addToast("Something went wrong. Please try again.", "error");
    },
  });

  const { data: messages } = trpc.agent.getMessages.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );

  const chatMutation = trpc.agent.chat.useMutation({
    onSuccess: (data) => {
      setOptimisticUserMessage(null);
      utils.agent.getMessages.invalidate({ conversationId: activeConversationId! });
      utils.agent.listConversations.invalidate();
      utils.task.list.invalidate();
      utils.note.list.invalidate();
      utils.goal.list.invalidate();

      if (data.message && onEntitiesDetected) {
        const domain = detectDomainFromContent(data.message);
        if (domain) onEntitiesDetected(domain);
      }
    },
  });

  const createConversation = trpc.agent.createConversation.useMutation({
    onSuccess: async (data) => {
      utils.agent.listConversations.invalidate();
      setActiveConversationId(data.id);

      if (pendingMessageRef.current) {
        const message = pendingMessageRef.current;
        pendingMessageRef.current = null;

        if (useStreaming) {
          startStream({ conversationId: data.id, message });
        } else {
          await chatMutation.mutateAsync({ conversationId: data.id, message });
        }
      }
    },
  });

  const sendMessage = useCallback(
    async (message: string) => {
      if (!activeConversationId || !message.trim()) return;

      setOptimisticUserMessage(message.trim());

      if (useStreaming) {
        startStream({ conversationId: activeConversationId, message });
      } else {
        await chatMutation.mutateAsync({ conversationId: activeConversationId, message });
      }
    },
    [activeConversationId, chatMutation, useStreaming, startStream]
  );

  const startNewConversation = useCallback(
    (initialMessage?: string) => {
      if (initialMessage) {
        pendingMessageRef.current = initialMessage;
        setOptimisticUserMessage(initialMessage.trim());
      }
      createConversation.mutate({});
    },
    [createConversation]
  );

  const allMessages: Message[] | undefined = useMemo(() => {
    if (!messages && !optimisticUserMessage && !isStreaming) return undefined;

    const baseMessages: Message[] = messages?.map((m) => ({
      ...m,
      isStreaming: false,
    })) ?? [];

    const result = [...baseMessages];

    if (optimisticUserMessage) {
      const lastMsg = baseMessages[baseMessages.length - 1];
      const alreadyInServer = lastMsg?.role === "user" && lastMsg.content === optimisticUserMessage;
      if (!alreadyInServer) {
        result.push({
          id: "optimistic-user",
          role: "user" as const,
          content: optimisticUserMessage,
          createdAt: new Date().toISOString(),
          isStreaming: false,
        });
      }
    }

    if (streamingMessage) {
      result.push(streamingMessage);
    }

    return result;
  }, [messages, optimisticUserMessage, isStreaming, streamingMessage]);

  return {
    messages: allMessages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    startNewConversation,
    isSending: chatMutation.isPending || isStreaming,
    isStreaming,
    isCreating: createConversation.isPending,
  };
}
