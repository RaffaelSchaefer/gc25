import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
  await import("./instrumentation-node");
  }
  registerOTel({
    serviceName: "gc25-ai",
    traceExporter: new LangfuseExporter({
      debug: process.env.NODE_ENV !== "production",
    }),
  });
}