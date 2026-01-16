export const MessageRoleValues = ["user", "model"] as const;

export type MessageRole = (typeof MessageRoleValues)[number];

export function isValidMessageRole(value: string): value is MessageRole {
  return MessageRoleValues.includes(value as MessageRole);
}
