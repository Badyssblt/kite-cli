"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (result.error) {
      setError(result.error.message || "Erreur lors de l'inscription");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <div className="auth-container">
      <h1>Inscription</h1>

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label htmlFor="name">Nom</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            required
            placeholder="Votre nom"
          />
        </div>

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
            minLength={8}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Inscription..." : "S'inscrire"}
        </button>
      </form>

      <p className="link">
        Déjà un compte ? <Link href="/login">Se connecter</Link>
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
          background: #000;
          color: #fff;
        }
        button:disabled {
          opacity: 0.5;
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
