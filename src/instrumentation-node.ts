import cron from "node-cron";
import { sendEventReminders, sendGoodieReminders } from "@/lib/reminders";

// Diese Datei wird nur im Node.js-Kontext importiert!

// WebSocket-Server initialisieren (Socket.IO)
(async () => {
    try {
        const { ensureIOServer } = await import("./lib/io");
        await ensureIOServer();
        } catch {
            console.error("Failed to ensure IO server");
        }
})();

cron.schedule("* * * * *", () => {
    sendEventReminders().catch(console.error);
    sendGoodieReminders().catch(console.error);
});
