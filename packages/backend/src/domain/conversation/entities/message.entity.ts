import { MessageRoleValues } from "../types.js";
import { MessageContentRequiredError, ValidationError } from "../../shared/errors/index.js";
import type { MessageRole, MessageProps } from "../types.js";

export class Message {
  private constructor(private readonly props: MessageProps) {}

  static create(props: MessageProps): Message {
    if (!props.content || props.content.trim().length === 0) {
      throw new MessageContentRequiredError();
    }
    if (!MessageRoleValues.includes(props.role)) {
      throw new ValidationError(`Invalid message role: ${props.role}`, { role: props.role });
    }
    return new Message(props);
  }

  static reconstitute(props: MessageProps): Message {
    return new Message(props);
  }

  get id(): string {
    return this.props.id;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get role(): MessageRole {
    return this.props.role;
  }

  get content(): string {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isFromUser(): boolean {
    return this.role === "user";
  }

  isFromModel(): boolean {
    return this.role === "model";
  }

  toJSON(): MessageProps {
    return { ...this.props };
  }
}
