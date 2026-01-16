import { Langfuse } from "langfuse";

let langfuseInstance: Langfuse | null = null;

export function getLangfuse(): Langfuse | null {
  if (langfuseInstance) {
    return langfuseInstance;
  }

  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_BASEURL || "http://localhost:3001";

  if (!secretKey || !publicKey) {
    console.warn(
      "Langfuse keys not configured. Tracing disabled. Set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY to enable."
    );
    return null;
  }

  langfuseInstance = new Langfuse({
    secretKey,
    publicKey,
    baseUrl,
    flushAt: 1,
    flushInterval: 1000,
  });

  console.log(`Langfuse tracing enabled (baseUrl: ${baseUrl})`);

  return langfuseInstance;
}

export async function shutdownLangfuse(): Promise<void> {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync();
    langfuseInstance = null;
  }
}
