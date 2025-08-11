import { LangfuseExporter } from 'langfuse-vercel';
import { registerOTel } from '@vercel/otel';

export async function register() {
  registerOTel({
    serviceName: 'langfuse-vercel-ai-nextjs-example',
    traceExporter: new LangfuseExporter(),
  });
  // Initialize Socket.IO server only when running in the Node.js runtime
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureIOServer } = await import("./src/lib/io");
    await ensureIOServer();
  } catch {
    // ignore
  }
}

export async function instrumentationHook() {
  return register();
}
