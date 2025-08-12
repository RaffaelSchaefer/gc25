// apps/web/instrumentation.ts
import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

export function register() {
  registerOTel({
    serviceName: "gc25-ai",
    traceExporter: new LangfuseExporter({
      debug: process.env.NODE_ENV !== "production",
    }),
  });
}

//TODO Reimplement Socket IO server
/*
 try {
    const { ensureIOServer } = await import("./src/lib/io");
    await ensureIOServer();
  } catch {
    // ignore
  }
*/