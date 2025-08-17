import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";
import cron from "node-cron";
import { sendEventReminders, sendGoodieReminders } from "@/lib/reminders";

export function register() {
  registerOTel({
    serviceName: "gc25-ai",
    traceExporter: new LangfuseExporter({
      debug: process.env.NODE_ENV !== "production",
    }),
  });

  cron.schedule("* * * * *", () => {
    sendEventReminders().catch(console.error);
    sendGoodieReminders().catch(console.error);
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
