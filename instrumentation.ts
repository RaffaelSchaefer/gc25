export async function register() {
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
