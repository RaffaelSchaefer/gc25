// Type augmentation for better-auth session user to include isAdmin
// This allows access to user.isAdmin across the app after adding the prisma field
import "better-auth";

declare module "better-auth" {
  interface BetterAuthUser {
    isAdmin?: boolean;
  }
}
