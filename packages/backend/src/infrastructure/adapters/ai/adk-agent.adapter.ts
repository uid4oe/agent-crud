import {
  InMemoryRunner,
  isFinalResponse,
  stringifyContent,
  type Event,
} from "@google/adk";
import { Content, Part, GoogleGenAI } from "@google/genai";
import { Langfuse } from "langfuse";
import type {
  AiAgentPort,
  StreamChunk,
  HistoryMessage,
} from "../../../domain/index.js";
import { createRootAgent } from "./agents/root-agent.factory.js";
import { getLangfuse } from "../observability/index.js";
import { Logger } from "../../logging/index.js";
import { AgentTimeoutError, withTimeout } from "./agent-timeout.js";
import { collectCards, formatCards, extractRoutingAgent, formatRoutingInfo } from "./entity-card.collector.js";
import type { AdkAgentAdapterConfig, EntityCard } from "./types.js";

/** Max time (ms) for a single chat() or chatStream() call before aborting. */
const AGENT_TIMEOUT_MS = 60_000;

/** Max time (ms) to wait for Langfuse flush before moving on. */
const LANGFUSE_FLUSH_TIMEOUT_MS = 3_000;

const FALLBACK_MESSAGE =
  "I'm sorry, I wasn't able to process that request. Please try again.";

export class AdkAgentAdapter implements AiAgentPort {
  private readonly runner: InMemoryRunner;
  private readonly langfuse: Langfuse | null;
  private readonly logger: Logger;
  private readonly appName = "agent-poc";
  private readonly genai: GoogleGenAI;
  private readonly model: string;

  constructor(config: AdkAgentAdapterConfig, logger: Logger) {
    this.logger = logger.child({ component: "AdkAgentAdapter" });
    this.langfuse = getLangfuse();
    this.model = config.model;

    // Set API key for ADK
    process.env.GOOGLE_GENAI_API_KEY = config.apiKey;

    this.genai = new GoogleGenAI({ apiKey: config.apiKey });

    const rootAgent = createRootAgent({
      taskRepository: config.taskRepository,
      noteRepository: config.noteRepository,
      goalRepository: config.goalRepository,
      model: config.model,
      routerModel: config.routerModel,
    });

    this.runner = new InMemoryRunner({
      agent: rootAgent,
      appName: this.appName,
    });
  }

  async chat(sessionId: string, userMessage: string, history?: HistoryMessage[]): Promise<string> {
    return this.withTracing("adk-chat", sessionId, userMessage, async (eventStream) => {
      let finalText = "";
      const cards: EntityCard[] = [];
      let routingAgent: string | null = null;

      for await (const event of eventStream) {
        collectCards(event, cards);
        if (!routingAgent) {
          routingAgent = extractRoutingAgent(event);
        }
        if (isFinalResponse(event)) {
          const text = stringifyContent(event);
          if (text) finalText = text;
        }
      }

      if (!finalText && cards.length === 0) {
        this.logger.warn("ADK returned empty response", { userMessage });
        finalText = FALLBACK_MESSAGE;
      } else if (!finalText && cards.length > 0) {
        finalText = "Done!";
      }

      if (routingAgent) {
        finalText = formatRoutingInfo(routingAgent) + "\n" + finalText;
      }

      if (cards.length > 0) {
        finalText += "\n" + formatCards(cards);
      }

      return finalText;
    }, history);
  }

  async *chatStream(
    sessionId: string,
    userMessage: string,
    history?: HistoryMessage[]
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const { trace, eventStream } = await this.prepareRun("adk-chat-stream", sessionId, userMessage, history);

    try {
      let fullResponse = "";
      const cards: EntityCard[] = [];
      let routingAgent: string | null = null;
      let routingInfoSent = false;

      for await (const event of eventStream) {
        collectCards(event, cards);
        if (!routingAgent) {
          routingAgent = extractRoutingAgent(event);
        }
        const text = this.extractText(event);

        // Send routing info badge before the first text chunk
        if (routingAgent && !routingInfoSent && text) {
          const routingTag = formatRoutingInfo(routingAgent) + "\n";
          fullResponse += routingTag;
          yield { text: routingTag, done: false };
          routingInfoSent = true;
        }

        if (text) {
          if (isFinalResponse(event)) {
            const newText = text.startsWith(fullResponse)
              ? text.slice(fullResponse.length)
              : text;
            if (newText) {
              fullResponse += newText;
              yield { text: newText, done: false };
            }
          } else {
            fullResponse += text;
            yield { text, done: false };
          }
        }
      }

      if (!fullResponse && cards.length === 0) {
        this.logger.warn("ADK stream returned empty response", { userMessage });
        yield { text: FALLBACK_MESSAGE, done: false };
      } else if (!fullResponse && cards.length > 0) {
        yield { text: "Done!", done: false };
      }

      if (cards.length > 0) {
        const cardText = "\n" + formatCards(cards);
        fullResponse += cardText;
        yield { text: cardText, done: false };
      }

      yield { text: "", done: true };

      trace?.update({ output: fullResponse, metadata: { streaming: true } });
    } catch (error) {
      this.logger.error("ADK chat stream failed", error as Error, { userMessage });
      trace?.update({
        output: { error: error instanceof Error ? error.message : "Unknown error" },
        tags: ["error"],
      });

      yield {
        text: error instanceof AgentTimeoutError
          ? "The request timed out. Please try again."
          : "An error occurred while processing your request.",
        done: false,
      };
      yield { text: "", done: true };
    } finally {
      this.flushLangfuse();
    }
  }

  async generateTitle(userMessage: string, aiResponse: string): Promise<string> {
    try {
      const response = await Promise.race([
        this.genai.models.generateContent({
          model: this.model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate a concise 3-6 word title for this conversation. Return ONLY the title text, nothing else.\n\nUser: ${userMessage}\nAssistant: ${aiResponse.slice(0, 200)}`,
                },
              ],
            },
          ],
          config: {
            maxOutputTokens: 20,
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Title generation timed out")), 10_000)),
      ]);

      const title = response.text?.trim();
      if (title && title.length > 0 && title.length <= 100) {
        return title;
      }
      return userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
    } catch (error) {
      this.logger.warn("Failed to generate title", { error: String(error) });
      return userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
    }
  }

  async summarizeConversation(messages: string): Promise<string> {
    try {
      const response = await Promise.race([
        this.genai.models.generateContent({
          model: this.model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Summarize this conversation in 2-3 sentences. Focus on the key topics discussed and any actions taken.\n\n${messages.slice(0, 4000)}`,
                },
              ],
            },
          ],
          config: {
            maxOutputTokens: 150,
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Summarization timed out")), 10_000)),
      ]);

      return response.text?.trim() ?? "";
    } catch (error) {
      this.logger.warn("Failed to summarize conversation", { error: String(error) });
      return "";
    }
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  private async prepareRun(
    traceName: string,
    sessionId: string,
    userMessage: string,
    history?: HistoryMessage[]
  ) {
    const trace = this.langfuse?.trace({
      name: traceName,
      input: { userMessage },
      metadata: { sessionId, streaming: traceName.includes("stream") },
    });

    const { userId } = await this.getOrCreateSession(sessionId);

    // Replay history into the ADK session if provided
    if (history && history.length > 0) {
      await this.replayHistory(sessionId, userId, history);
    }

    const userContent: Content = { role: "user", parts: [{ text: userMessage }] };

    const eventStream = withTimeout(
      this.runner.runAsync({ userId, sessionId, newMessage: userContent }),
      AGENT_TIMEOUT_MS
    );

    return { trace, eventStream };
  }

  private async withTracing(
    traceName: string,
    sessionId: string,
    userMessage: string,
    fn: (eventStream: AsyncGenerator<Event>) => Promise<string>,
    history?: HistoryMessage[]
  ): Promise<string> {
    const { trace, eventStream } = await this.prepareRun(traceName, sessionId, userMessage, history);

    try {
      const result = await fn(eventStream);
      trace?.update({ output: result });
      return result;
    } catch (error) {
      this.logger.error(`${traceName} failed`, error as Error, { userMessage });
      trace?.update({
        output: { error: error instanceof Error ? error.message : "Unknown error" },
        tags: ["error"],
      });
      if (error instanceof AgentTimeoutError) return FALLBACK_MESSAGE;
      throw error;
    } finally {
      this.flushLangfuse();
    }
  }

  private async getOrCreateSession(sessionId: string): Promise<{ userId: string; sessionId: string }> {
    const userId = "default-user";

    const existing = await this.runner.sessionService.getSession({
      appName: this.appName,
      userId,
      sessionId,
    });

    if (!existing) {
      await this.runner.sessionService.createSession({
        appName: this.appName,
        userId,
        sessionId,
      });
    }

    return { userId, sessionId };
  }

  private async replayHistory(
    sessionId: string,
    userId: string,
    history: HistoryMessage[]
  ): Promise<void> {
    // Check if session already has events (avoid replaying on subsequent messages)
    const session = await this.runner.sessionService.getSession({
      appName: this.appName,
      userId,
      sessionId,
    });

    // Only replay if the session is fresh (no events yet)
    if (session && session.events && session.events.length > 0) {
      return;
    }

    // Replay history by running each message through the session
    // This uses the ADK's built-in session management to maintain context
    for (const msg of history) {
      if (msg.role === "user") {
        const userContent: Content = { role: "user", parts: [{ text: msg.content }] };
        // Run with a fast iteration to seed the session state
        try {
          const stream = this.runner.runAsync({ userId, sessionId, newMessage: userContent });
          // Consume and discard - we just want the session state updated
          for await (const _event of stream) {
            // Consuming events to update session state
            break; // Only need first event to register the message
          }
        } catch {
          // Non-critical - continue with remaining history
        }
      }
    }
  }

  private extractText(event: Event): string {
    if (!event.content?.parts) return "";

    return event.content.parts
      .filter((p: Part) => "text" in p && p.text)
      .map((p: Part) => p.text!)
      .join("");
  }

  private flushLangfuse(): void {
    if (!this.langfuse) return;

    Promise.race([
      this.langfuse.flushAsync(),
      new Promise((resolve) => setTimeout(resolve, LANGFUSE_FLUSH_TIMEOUT_MS)),
    ]).catch((err) => {
      this.logger.warn("Langfuse flush failed", { error: String(err) });
    });
  }
}

export { AgentTimeoutError } from "./agent-timeout.js";
