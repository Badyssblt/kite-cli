"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <button onClick={handleSignOut} className="sign-out-button">
      Se déconnecter
      <style jsx>{`
        .sign-out-button {
          padding: 0.75rem 1.5rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .sign-out-button:hover {
          background: #dc2626;
        }
      `}</style>
    </button>
  );
}
