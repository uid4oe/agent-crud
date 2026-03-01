// ============================================
// Value Object
// ============================================

export const MessageRoleValues = ["user", "model"] as const;

export type MessageRole = (typeof MessageRoleValues)[number];

// ============================================
// Entity Props
// ============================================

export interface ConversationProps {
  id: string;
  title: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationProps {
  title?: string | null;
}

export interface MessageProps {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface CreateMessageProps {
  conversationId: string;
  role: MessageRole;
  content: string;
}

// ============================================
// Service Input/Output
// ============================================

export interface CreateConversationInput {
  title?: string;
}

export interface GetConversationInput {
  id: string;
}

export interface DeleteConversationInput {
  id: string;
}

export interface GetMessagesInput {
  conversationId: string;
}

export interface ChatInput {
  conversationId: string;
  message: string;
}

export interface ChatOutput {
  response: string;
  conversationId: string;
}

export interface ChatStreamChunk {
  text: string;
  done: boolean;
  conversationId: string;
}
