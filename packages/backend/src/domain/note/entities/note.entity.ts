import { NoteCategoryValues } from "../types.js";
import { NoteTitleRequiredError, NoteInvalidCategoryError } from "../../shared/errors/index.js";
import type { NoteProps, NoteCategory } from "../types.js";

export class Note {
  private constructor(private readonly props: NoteProps) {}

  static create(props: NoteProps): Note {
    if (!props.title || props.title.trim().length === 0) {
      throw new NoteTitleRequiredError();
    }
    if (!NoteCategoryValues.includes(props.category)) {
      throw new NoteInvalidCategoryError(props.category);
    }
    return new Note(props);
  }

  static reconstitute(props: NoteProps): Note {
    return new Note(props);
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get category(): NoteCategory {
    return this.props.category;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateTitle(title: string): Note {
    if (!title || title.trim().length === 0) {
      throw new NoteTitleRequiredError();
    }
    return new Note({
      ...this.props,
      title,
      updatedAt: new Date(),
    });
  }

  updateContent(content: string): Note {
    return new Note({
      ...this.props,
      content,
      updatedAt: new Date(),
    });
  }

  updateCategory(category: NoteCategory): Note {
    if (!NoteCategoryValues.includes(category)) {
      throw new NoteInvalidCategoryError(category);
    }
    return new Note({
      ...this.props,
      category,
      updatedAt: new Date(),
    });
  }

  updateTags(tags: string[]): Note {
    return new Note({
      ...this.props,
      tags: [...tags],
      updatedAt: new Date(),
    });
  }

  addTag(tag: string): Note {
    if (this.props.tags.includes(tag)) {
      return this;
    }
    return new Note({
      ...this.props,
      tags: [...this.props.tags, tag],
      updatedAt: new Date(),
    });
  }

  removeTag(tag: string): Note {
    return new Note({
      ...this.props,
      tags: this.props.tags.filter((t) => t !== tag),
      updatedAt: new Date(),
    });
  }

  toJSON(): NoteProps {
    return {
      ...this.props,
      tags: [...this.props.tags],
    };
  }
}
