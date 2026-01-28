"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message || "Erreur de connexion");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  async function handleGitHubLogin() {
    await authClient.signIn.social({ provider: "github" });
  }

  async function handleGoogleLogin() {
    await authClient.signIn.social({ provider: "google" });
  }

  return (
    <div className="auth-container">
      <h1>Connexion</h1>

      <form onSubmit={handleEmailLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="votre@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            placeholder="••••••••"
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <div className="divider">
        <span>ou</span>
      </div>

      <div className="social-buttons">
        <button onClick={handleGitHubLogin} className="github">
          Continuer avec GitHub
        </button>
        <button onClick={handleGoogleLogin} className="google">
          Continuer avec Google
        </button>
      </div>

      <p className="link">
        Pas encore de compte ? <Link href="/register">S&apos;inscrire</Link>
      </p>

      <style jsx>{`
        .auth-container {
          max-width: 400px;
          margin: 2rem auto;
          padding: 2rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        input {
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 0.75rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        button[type="submit"] {
          background: #000;
          color: #fff;
        }
        button:disabled {
          opacity: 0.5;
        }
        .divider {
          text-align: center;
          margin: 1.5rem 0;
          color: #666;
        }
        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .github {
          background: #24292e;
          color: #fff;
        }
        .google {
          background: #4285f4;
          color: #fff;
        }
        .error {
          color: red;
          font-size: 0.875rem;
        }
        .link {
          text-align: center;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
