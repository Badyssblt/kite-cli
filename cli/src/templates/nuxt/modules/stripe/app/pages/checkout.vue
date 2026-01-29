<template>
  <div class="checkout-container">
    <h1>Checkout</h1>

    <div class="products">
      <div v-for="product in products" :key="product.id" class="product-card">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
        <p class="price">{{ formatPrice(product.price) }}</p>
        <button @click="handleCheckout(product.priceId)" :disabled="loading">
          {{ loading ? "Chargement..." : "Acheter" }}
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const loading = ref(false);
const error = ref("");

// Exemple de produits - À remplacer par vos vrais IDs de prix Stripe
const products = [
  {
    id: 1,
    name: "Produit Basique",
    description: "Un produit simple et efficace",
    price: 999, // en centimes
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

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const handleCheckout = async (priceId: string) => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await useFetch("/api/create-checkout-session", {
      method: "POST",
      body: {
        priceId,
        quantity: 1,
      },
    });

    if (data.value?.url) {
      // Rediriger vers Stripe Checkout
      window.location.href = data.value.url;
    } else {
      error.value = "Impossible de créer la session de paiement";
    }
  } catch (err: any) {
    error.value = err.message || "Une erreur est survenue";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
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
</style>
