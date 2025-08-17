(async () => {
    try {
        const { ensureIOServer } = await import("./lib/io");
        await ensureIOServer();
        } catch {
            console.error("Failed to ensure IO server");
        }
})();

export {};