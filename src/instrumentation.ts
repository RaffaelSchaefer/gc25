export async function register() {
  // No-op in src instrumentation to avoid edge bundling of server code
}

export async function instrumentationHook() {
  return register();
}
