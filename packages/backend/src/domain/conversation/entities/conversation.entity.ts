import type { ConversationProps } from "../types.js";

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

  get summary(): string | null {
    return this.props.summary;
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
