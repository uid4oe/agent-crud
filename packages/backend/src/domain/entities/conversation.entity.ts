import { Message, MessageProps } from "./message.entity.js";

export interface ConversationProps {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationProps {
  title?: string | null;
}

export class Conversation {
  private constructor(private readonly props: ConversationProps) {}

  static create(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  static reconstitute(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string | null {
    return this.props.title;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateTitle(title: string): Conversation {
    return new Conversation({
      ...this.props,
      title,
      updatedAt: new Date(),
    });
  }

  toJSON(): ConversationProps {
    return { ...this.props };
  }
}
