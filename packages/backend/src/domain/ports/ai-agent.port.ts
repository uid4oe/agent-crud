export interface ChatHistory {
  role: "user" | "model";
  content: string;
}

export interface AiAgentPort {
  chat(history: ChatHistory[], userMessage: string): Promise<string>;
}
