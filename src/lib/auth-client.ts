import { createAuthClient } from "better-auth/react";

function getBaseURL(): string | undefined {
  // Prefer same-origin in the browser to avoid CORS
  if (typeof window !== "undefined") return window.location.origin;
  // On the server (SSR), allow overriding via env for production deployments
  // e.g. https://gc.raffaelschaefer.de
  return process.env.BETTER_AUTH_BASE_URL || undefined;
}

const client = createAuthClient({
  baseURL: getBaseURL(),
});

export const authClient = client;
export const { signIn, signUp, useSession } = client;
