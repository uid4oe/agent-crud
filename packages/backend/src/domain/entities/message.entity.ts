import { MessageRole, MessageRoleValues } from "../value-objects/message-role.vo.js";

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

export class Message {
  private constructor(private readonly props: MessageProps) {}

  static create(props: MessageProps): Message {
    if (!props.content || props.content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }
    if (!MessageRoleValues.includes(props.role)) {
      throw new Error(`Invalid message role: ${props.role}`);
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
