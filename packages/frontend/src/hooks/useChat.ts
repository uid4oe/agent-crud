import { useState, useCallback } from "react";
import { trpc } from "../lib/trpc";

export function useChat() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: conversations } = trpc.agent.listConversations.useQuery();

  const { data: messages } = trpc.agent.getMessages.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );

  const createConversation = trpc.agent.createConversation.useMutation({
    onSuccess: (data) => {
      utils.agent.listConversations.invalidate();
      setActiveConversationId(data.id);
    },
  });

  const deleteConversation = trpc.agent.deleteConversation.useMutation({
    onSuccess: () => {
      utils.agent.listConversations.invalidate();
      setActiveConversationId(null);
    },
  });

  const chatMutation = trpc.agent.chat.useMutation({
    onSuccess: () => {
      utils.agent.getMessages.invalidate({ conversationId: activeConversationId! });
      utils.agent.listConversations.invalidate();
      utils.task.list.invalidate();
    },
  });

  const sendMessage = useCallback(
    async (message: string) => {
      if (!activeConversationId || !message.trim()) return;
      await chatMutation.mutateAsync({ conversationId: activeConversationId, message });
    },
    [activeConversationId, chatMutation]
  );

  const startNewConversation = useCallback(() => {
    createConversation.mutate({});
  }, [createConversation]);

  const removeConversation = useCallback(
    (id: string) => {
      deleteConversation.mutate({ id });
    },
    [deleteConversation]
  );

  return {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    startNewConversation,
    removeConversation,
    isSending: chatMutation.isPending,
    isCreating: createConversation.isPending,
  };
}
