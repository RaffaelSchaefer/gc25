import { auth } from "@/lib/auth";

export type Session = { user: { id: string } } | null;

export type RunCtx = {
  session?: Session | null;
  headers?: Headers;
  cache?: Map<string, any>;
  requestId?: string;
};

export function ctxOf(options: any): RunCtx {
  return ((options as any)?.experimental_context ?? {}) as RunCtx;
}

export async function fromCache<T>(
  options: any,
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const ctx = ctxOf(options);
  if (!ctx.cache) return loader();
  if (ctx.cache.has(key)) return ctx.cache.get(key);
  const val = await loader();
  ctx.cache.set(key, val);
  return val;
}

export function assertAuthSession(ctx: RunCtx) {
  if (!ctx.session) return { error: "auth-required" } as const;
  return null;
}

export async function getSessionFromHeaders(
  headers: Headers,
): Promise<Session> {
  try {
    const s = await auth.api.getSession({ headers });
    return s ?? null;
  } catch {
    return null;
  }
}
