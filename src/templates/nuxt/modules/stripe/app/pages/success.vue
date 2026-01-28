<template>
  <div class="success-container">
    <div v-if="loading" class="loading">
      <p>Vérification du paiement...</p>
    </div>

    <div v-else-if="error" class="error-box">
      <h1>❌ Erreur</h1>
      <p>{{ error }}</p>
      <NuxtLink to="/checkout" class="button">Retour</NuxtLink>
    </div>

    <div v-else class="success-box">
      <h1>✅ Paiement réussi !</h1>
      <p>Merci pour votre achat.</p>

      <div v-if="sessionData" class="session-info">
        <p><strong>Email:</strong> {{ sessionData.customerEmail }}</p>
        <p>
          <strong>Montant:</strong>
          {{ formatPrice(sessionData.amountTotal) }}
        </p>
        <p><strong>Statut:</strong> {{ sessionData.status }}</p>
      </div>

      <NuxtLink to="/" class="button">Retour à l'accueil</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const sessionId = route.query.session_id;

const loading = ref(true);
const error = ref("");
const sessionData = ref(null);

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

onMounted(async () => {
  if (!sessionId) {
    error.value = "Session ID manquant";
    loading.value = false;
    return;
  }

  try {
    const { data, error: fetchError } = await useFetch("/api/verify-session", {
      query: { session_id: sessionId },
    });

    if (fetchError.value) {
      error.value = "Impossible de vérifier le paiement";
    } else {
      sessionData.value = data.value;
    }
  } catch (err: any) {
    error.value = err.message || "Une erreur est survenue";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.success-container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
}

.success-box,
.error-box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 3rem 2rem;
}

.success-box {
  border-color: #10b981;
  background: #f0fdf4;
}

.error-box {
  border-color: #ef4444;
  background: #fef2f2;
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
  transition: background 0.2s;
}

.button:hover {
  background: #4f46e5;
}

.loading {
  padding: 3rem;
  font-size: 1.125rem;
  color: #666;
}
</style>
