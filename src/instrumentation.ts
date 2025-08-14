import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

/**
 * Runs once when the Next.js server starts. Besides registering
 * OpenTelemetry, we also spin up the standalone Socket.IO server
 * used for WebSocket communication. This only runs on the Node.js
 * runtime (e.g. Docker deployments via Coolify).
 */
export async function register() {
  registerOTel({
    serviceName: "gc25-ai",
    traceExporter: new LangfuseExporter({
      debug: process.env.NODE_ENV !== "production",
    }),
  });

  // Start Socket.IO server if possible. Errors are swallowed so the
  // application can still boot without real-time features.
  try {
    const { ensureIOServer } = await import("./lib/io");
    await ensureIOServer();
  } catch {
    // ignore – likely running in a runtime without Node.js
  }
}
