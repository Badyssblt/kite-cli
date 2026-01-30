import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient();

// Export des méthodes utiles
export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
