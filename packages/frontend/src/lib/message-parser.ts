import type { Goal, Note, Task } from "../types";

export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "task-card"; data: Task }
  | { type: "note-card"; data: Note }
  | { type: "goal-card"; data: Goal };

const CARD_TYPES = ["task-card", "note-card", "goal-card"] as const;
type CardType = (typeof CARD_TYPES)[number];
const ROUTING_REGEX = /<routing-info>([\s\S]*?)<\/routing-info>/g;

/**
 * Parse entity cards from message content.
 *
 * Uses indexOf-based scanning instead of a single greedy regex so that
 * JSON payloads containing markup-like strings (e.g. "</task-card>") are
 * handled correctly — we find the opening tag, then locate the matching
 * close tag *after* validating JSON boundaries.
 */
export function parseMessageContent(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    // Find the earliest opening card tag from the current cursor
    let earliest: { type: CardType; openStart: number; jsonStart: number } | null = null;

    for (const cardType of CARD_TYPES) {
      const openTag = `<${cardType}>`;
      const idx = content.indexOf(openTag, cursor);
      if (idx !== -1 && (earliest === null || idx < earliest.openStart)) {
        earliest = { type: cardType, openStart: idx, jsonStart: idx + openTag.length };
      }
    }

    if (!earliest) {
      // No more card tags — rest is text
      const text = content.slice(cursor).trim();
      if (text) segments.push({ type: "text", content: text });
      break;
    }

    // Push any text before this card tag
    if (earliest.openStart > cursor) {
      const text = content.slice(cursor, earliest.openStart).trim();
      if (text) segments.push({ type: "text", content: text });
    }

    const closeTag = `</${earliest.type}>`;
    const closeIdx = content.indexOf(closeTag, earliest.jsonStart);

    if (closeIdx === -1) {
      // No closing tag found — treat rest as text
      const text = content.slice(earliest.openStart).trim();
      if (text) segments.push({ type: "text", content: text });
      break;
    }

    const jsonStr = content.slice(earliest.jsonStart, closeIdx);
    try {
      const data = JSON.parse(jsonStr);
      segments.push({ type: earliest.type, data });
    } catch {
      // Malformed JSON — skip the tag entirely
    }

    cursor = closeIdx + closeTag.length;
  }

  return segments;
}

/** Extract routing agent name from message content. */
export function extractRoutingInfo(content: string): string | null {
  ROUTING_REGEX.lastIndex = 0;
  const match = ROUTING_REGEX.exec(content);
  return match ? match[1].trim() : null;
}

/** Strip card tags and routing tags from content. */
export function stripCardTags(content: string): string {
  let result = content;
  for (const cardType of CARD_TYPES) {
    const openTag = `<${cardType}>`;
    const closeTag = `</${cardType}>`;
    let openIdx = result.indexOf(openTag);
    while (openIdx !== -1) {
      const closeIdx = result.indexOf(closeTag, openIdx);
      if (closeIdx === -1) break;
      result = result.slice(0, openIdx) + result.slice(closeIdx + closeTag.length);
      openIdx = result.indexOf(openTag);
    }
  }
  return result.replace(ROUTING_REGEX, "").trim();
}
