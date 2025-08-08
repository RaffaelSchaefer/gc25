export async function register() {
  // Boot the standalone Socket.IO server when the app starts
  try {
    const { ensureIOServer } = await import("@/lib/io");
    await ensureIOServer();
  } catch {
    // ignore boot errors in build or non-server contexts
  }
}

export async function instrumentationHook() {
  // alias for older Next runtimes
  return register();
}
