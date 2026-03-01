import { useCallback, useMemo, useRef, useState } from "react";
import { useToast } from "../app/providers/ToastProvider";
import { parseMessageContent } from "../lib/message-parser";
import { trpc } from "../lib/trpc";
import type { Message } from "../types";
import { useChatStream } from "./useChatStream";

export type DetectedDomain = "tasks" | "notes" | "goals";

const CARD_TYPE_TO_DOMAIN: Record<string, DetectedDomain> = {
  "task-card": "tasks",
  "note-card": "notes",
  "goal-card": "goals",
};

export interface DetectedEntities {
  primaryDomain: DetectedDomain;
  entityIdsByDomain: Partial<Record<DetectedDomain, string[]>>;
}

export function detectDomainFromContent(content: string): DetectedDomain | null {
  const result = detectEntitiesFromContent(content);
  return result?.primaryDomain ?? null;
}

const DOMAIN_KEYWORDS: { domain: DetectedDomain; patterns: RegExp }[] = [
  { domain: "goals", patterns: /\b(goal|milestone|progress)\b/i },
  { domain: "tasks", patterns: /\b(task|todo|to-do)\b/i },
  { domain: "notes", patterns: /\b(note|notes)\b/i },
];

export function detectEntitiesFromContent(content: string): DetectedEntities | null {
  const segments = parseMessageContent(content);
  let primaryDomain: DetectedDomain | null = null;
  const entityIdsByDomain: Partial<Record<DetectedDomain, string[]>> = {};

  for (const seg of segments) {
    if (seg.type !== "text") {
      const d = CARD_TYPE_TO_DOMAIN[seg.type];
      if (d) {
        if (!primaryDomain) primaryDomain = d;
        if (seg.data?.id) {
          if (!entityIdsByDomain[d]) entityIdsByDomain[d] = [];
          entityIdsByDomain[d]!.push(seg.data.id);
        }
      }
    }
  }

  // Fallback: infer domain from text keywords when no card tags found
  if (!primaryDomain) {
    for (const { domain, patterns } of DOMAIN_KEYWORDS) {
      if (patterns.test(content)) {
        primaryDomain = domain;
        break;
      }
    }
  }

  return primaryDomain ? { primaryDomain, entityIdsByDomain } : null;
}

interface ChatOptions {
  onConversationChange?: (id: string | null) => void;
  initialConversationId?: string | null;
  useStreaming?: boolean;
  onEntitiesDetected?: (detected: DetectedEntities) => void;
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
        const detected = detectEntitiesFromContent(finalContent);
        if (detected) onEntitiesDetected(detected);
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
        const detected = detectEntitiesFromContent(data.message);
        if (detected) onEntitiesDetected(detected);
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
