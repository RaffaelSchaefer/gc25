import { Langfuse } from "langfuse";

type LangfuseLike = {
  trace: (...args: any[]) => any;
  flushAsync?: () => Promise<void>;
};

declare global {
  // eslint-disable-next-line no-var
  var _langfuse: LangfuseLike | undefined;
}

function createLangfuse(): LangfuseLike {
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY; // optional
  const baseUrl = process.env.LANGFUSE_BASEURL ?? "https://cloud.langfuse.com";

  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[langfuse] Missing LANGFUSE_SECRET_KEY – using no-op exporter.",
      );
    }
    return {
      trace: () => undefined,
      flushAsync: async () => {},
    };
  }

  return new Langfuse({
    secretKey,
    publicKey,
    baseUrl,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    environment: process.env.NODE_ENV,
  }) as unknown as LangfuseLike;
}

export const langfuse: LangfuseLike = globalThis._langfuse ?? createLangfuse();
if (!globalThis._langfuse) globalThis._langfuse = langfuse;
