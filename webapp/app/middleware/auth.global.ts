import { authClient } from "~~/lib/auth-client";

// Routes qui nécessitent une authentification
const protectedRoutes = ["/dashboard", "/profile", "/settings"];

// Routes réservées aux utilisateurs non connectés
const authRoutes = ["/login", "/register"];

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);
  
  const isProtectedRoute = protectedRoutes.some((route) =>
    to.path.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => to.path.startsWith(route));

  // Rediriger vers login si non connecté et route protégée
  if (!session.value && isProtectedRoute) {
    return navigateTo("/login");
  }

  // Rediriger vers dashboard si connecté et sur page auth
  if (session.value && isAuthRoute) {
    return navigateTo("/dashboard");
  }
});
