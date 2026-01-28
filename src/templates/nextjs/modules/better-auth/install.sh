#!/bin/bash

# Install Better Auth
npm install better-auth
npm install -D @better-auth/cli

# Create lib/auth.ts
mkdir -p lib
cat > lib/auth.ts << 'EOF'
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
});
EOF

# Create lib/auth-client.ts
cat > lib/auth-client.ts << 'EOF'
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
EOF

# Create API route
mkdir -p "app/api/auth/[...all]"
cat > "app/api/auth/[...all]/route.ts" << 'EOF'
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
EOF

# Create session API route
mkdir -p app/api/session
cat > app/api/session/route.ts << 'EOF'
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return NextResponse.json(session);
}
EOF

# Create login page
mkdir -p app/login
cat > app/login/page.tsx << 'EOF'
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message || "Login failed");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "2rem" }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem" }}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        No account? <Link href="/register">Register</Link>
      </p>
    </div>
  );
}
EOF

# Create register page
mkdir -p app/register
cat > app/register/page.tsx << 'EOF'
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authClient.signUp.email({ name, email, password });

    if (result.error) {
      setError(result.error.message || "Registration failed");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", padding: "2rem" }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem" }}>
          {loading ? "Loading..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        Have an account? <Link href="/login">Login</Link>
      </p>
    </div>
  );
}
EOF

# Create dashboard page
mkdir -p app/dashboard
cat > app/dashboard/page.tsx << 'EOF'
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div style={{ maxWidth: 600, margin: "4rem auto", padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name || session.user.email}!</p>
      <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: 4 }}>
        {JSON.stringify(session, null, 2)}
      </pre>
      <SignOutButton />
    </div>
  );
}
EOF

cat > app/dashboard/sign-out-button.tsx << 'EOF'
"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <button onClick={handleSignOut} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
      Sign Out
    </button>
  );
}
EOF

# Add env variables
if [ -f ".env" ]; then
  echo "" >> .env
  echo "# Better Auth" >> .env
  echo "BETTER_AUTH_SECRET=change-me-run-openssl-rand-base64-32" >> .env
  echo "BETTER_AUTH_URL=http://localhost:3000" >> .env
  echo "GITHUB_CLIENT_ID=" >> .env
  echo "GITHUB_CLIENT_SECRET=" >> .env
fi

echo "✓ Better Auth installed"
echo "  Next steps:"
echo "  1. Generate secret: openssl rand -base64 32"
echo "  2. Update BETTER_AUTH_SECRET in .env"
echo "  3. Run: npx @better-auth/cli migrate"
