import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

// Export des méthodes utiles
export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
