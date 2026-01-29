"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface SessionData {
  status: string;
  customerEmail: string;
  amountTotal: number;
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setError("Session ID manquant");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/stripe/verify-session?session_id=${sessionId}`
        );
        const data = await response.json();

        if (response.ok) {
          setSessionData(data);
        } else {
          setError(data.error || "Impossible de vérifier le paiement");
        }
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="success-container">
        <div className="loading">
          <p>Vérification du paiement...</p>
        </div>
        <style jsx>{`
          .success-container {
            max-width: 600px;
            margin: 4rem auto;
            padding: 2rem;
            text-align: center;
          }
          .loading {
            padding: 3rem;
            font-size: 1.125rem;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="success-container">
        <div className="error-box">
          <h1>Erreur</h1>
          <p>{error}</p>
          <Link href="/checkout" className="button">
            Retour
          </Link>
        </div>
        <style jsx>{`
          .success-container {
            max-width: 600px;
            margin: 4rem auto;
            padding: 2rem;
            text-align: center;
          }
          .error-box {
            border: 1px solid #ef4444;
            background: #fef2f2;
            border-radius: 8px;
            padding: 3rem 2rem;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.125rem;
            color: #666;
            margin-bottom: 1rem;
          }
          .button {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.75rem 2rem;
            background: #635bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-box">
        <h1>Paiement réussi !</h1>
        <p>Merci pour votre achat.</p>

        {sessionData && (
          <div className="session-info">
            <p>
              <strong>Email:</strong> {sessionData.customerEmail}
            </p>
            <p>
              <strong>Montant:</strong> {formatPrice(sessionData.amountTotal)}
            </p>
            <p>
              <strong>Statut:</strong> {sessionData.status}
            </p>
          </div>
        )}

        <Link href="/" className="button">
          Retour à l&apos;accueil
        </Link>
      </div>

      <style jsx>{`
        .success-container {
          max-width: 600px;
          margin: 4rem auto;
          padding: 2rem;
          text-align: center;
        }
        .success-box {
          border: 1px solid #10b981;
          background: #f0fdf4;
          border-radius: 8px;
          padding: 3rem 2rem;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.125rem;
          color: #666;
          margin-bottom: 1rem;
        }
        .session-info {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
          text-align: left;
        }
        .session-info p {
          margin-bottom: 0.5rem;
          color: #333;
        }
        .button {
          display: inline-block;
          margin-top: 2rem;
          padding: 0.75rem 2rem;
          background: #635bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
