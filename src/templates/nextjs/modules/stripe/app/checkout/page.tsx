"use client";

import { useState } from "react";

const products = [
  {
    id: 1,
    name: "Produit Basique",
    description: "Un produit simple et efficace",
    price: 999,
    priceId: "price_XXXXXXXXXX", // Remplacer par votre Price ID Stripe
  },
  {
    id: 2,
    name: "Produit Premium",
    description: "Le meilleur de nos produits",
    price: 2999,
    priceId: "price_YYYYYYYYYY",
  },
];

function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout(priceId: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, quantity: 1 }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Impossible de créer la session de paiement");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      <div className="products">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="price">{formatPrice(product.price)}</p>
            <button
              onClick={() => handleCheckout(product.priceId)}
              disabled={loading}
            >
              {loading ? "Chargement..." : "Acheter"}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <style jsx>{`
        .checkout-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 2rem;
        }
        h1 {
          text-align: center;
          margin-bottom: 2rem;
        }
        .products {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .product-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
        }
        .product-card h3 {
          margin-bottom: 1rem;
        }
        .product-card p {
          color: #666;
          margin-bottom: 1rem;
        }
        .price {
          font-size: 2rem;
          font-weight: bold;
          color: #000;
          margin: 1.5rem 0;
        }
        button {
          padding: 0.75rem 2rem;
          background: #635bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: background 0.2s;
        }
        button:hover:not(:disabled) {
          background: #4f46e5;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error {
          color: #ef4444;
          text-align: center;
          margin-top: 2rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
