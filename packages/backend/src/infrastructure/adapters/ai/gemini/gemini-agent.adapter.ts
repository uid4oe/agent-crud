import { GoogleGenerativeAI, Content, Tool, EnhancedGenerateContentResponse, ChatSession } from "@google/generative-ai";
import { Langfuse, LangfuseTraceClient } from "langfuse";
import { AiAgentPort, ChatHistory } from "../../../../domain/index.js";
import { ToolExecutor } from "../tools/index.js";
import { getLangfuse } from "../../observability/index.js";

export interface GeminiConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
  tools: Tool[];
}

export class GeminiAgentAdapter implements AiAgentPort {
  private genAI: GoogleGenerativeAI;
  private langfuse: Langfuse | null;

  constructor(
    private readonly config: GeminiConfig,
    private readonly toolExecutor: ToolExecutor
  ) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.langfuse = getLangfuse();
  }

  async chat(history: ChatHistory[], userMessage: string): Promise<string> {
    const trace = this.langfuse?.trace({
      name: "agent-chat",
      input: { userMessage, historyLength: history.length },
      metadata: { model: this.config.model },
    });

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model,
        tools: this.config.tools,
        systemInstruction: this.config.systemPrompt,
      });

      const chatHistory: Content[] = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({ history: chatHistory });

      let response = await this.tracedSendMessage(chat, userMessage, trace, "initial");
      let result = response.response;
      let iterationCount = 0;

      while (this.hasFunctionCalls(result)) {
        iterationCount++;
        const functionResponses = await this.processFunctionCalls(result, trace, iterationCount);
        response = await this.tracedSendMessage(chat, functionResponses, trace, `tool-response-${iterationCount}`);
        result = response.response;
      }

      const finalResponse = this.extractTextResponse(result);

      trace?.update({
        output: { response: finalResponse, toolIterations: iterationCount },
      });

      return finalResponse;
    } catch (error) {
      trace?.update({
        output: { error: error instanceof Error ? error.message : "Unknown error" },
        tags: ["error"],
      });
      throw error;
    } finally {
      await this.langfuse?.flushAsync();
    }
  }

  private async tracedSendMessage(
    chat: ChatSession,
    message: string | object[],
    trace: LangfuseTraceClient | undefined,
    spanName: string
  ) {
    const generation = trace?.generation({
      name: `gemini-${spanName}`,
      model: this.config.model,
      input: typeof message === "string" ? message : JSON.stringify(message),
    });

    const startTime = Date.now();
    const response = await chat.sendMessage(message as string);
    const endTime = Date.now();

    const responseText = this.extractTextResponse(response.response);
    const functionCalls = this.extractFunctionCalls(response.response);

    generation?.end({
      output: functionCalls.length > 0 ? { functionCalls, text: responseText } : responseText,
      usage: {
        input: response.response.usageMetadata?.promptTokenCount,
        output: response.response.usageMetadata?.candidatesTokenCount,
        total: response.response.usageMetadata?.totalTokenCount,
      },
      completionStartTime: new Date(startTime),
    });

    return response;
  }

  private hasFunctionCalls(result: EnhancedGenerateContentResponse): boolean {
    const parts = result.candidates?.[0]?.content?.parts;
    return !!parts?.some((p) => "functionCall" in p);
  }

  private extractFunctionCalls(result: EnhancedGenerateContentResponse): Array<{ name: string; args: object }> {
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    return parts
      .filter((p) => "functionCall" in p && p.functionCall)
      .map((part) => {
        const fc = (part as { functionCall: { name: string; args: object } }).functionCall;
        return { name: fc.name, args: fc.args };
      });
  }

  private async processFunctionCalls(
    result: EnhancedGenerateContentResponse,
    trace: LangfuseTraceClient | undefined,
    iteration: number
  ) {
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = parts.filter((p) => "functionCall" in p && p.functionCall);

    return Promise.all(
      functionCalls.map(async (part) => {
        const fc = (part as { functionCall: { name: string; args: object } }).functionCall;

        const span = trace?.span({
          name: `tool-${fc.name}`,
          input: fc.args,
          metadata: { iteration },
        });

        const startTime = Date.now();
        const toolResult = await this.toolExecutor.execute(fc.name, fc.args as Record<string, unknown>);
        const endTime = Date.now();

        span?.end({
          output: toolResult,
        });

        return {
          functionResponse: {
            name: fc.name,
            response: { result: toolResult },
          },
        };
      })
    );
  }

  private extractTextResponse(result: EnhancedGenerateContentResponse): string {
    const textParts = result.candidates?.[0]?.content?.parts?.filter((p) => "text" in p);
    return textParts?.map((p) => (p as { text: string }).text).join("") || "No response generated";
  }
}
