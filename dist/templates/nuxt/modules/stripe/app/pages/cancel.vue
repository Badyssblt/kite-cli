<template>
  <div class="cancel-container">
    <div class="cancel-box">
      <h1>❌ Paiement annulé</h1>
      <p>Votre paiement a été annulé. Aucun montant n'a été débité.</p>
      <p>Vous pouvez réessayer quand vous le souhaitez.</p>

      <div class="actions">
        <NuxtLink to="/checkout" class="button primary">
          Retour au checkout
        </NuxtLink>
        <NuxtLink to="/" class="button secondary"> Retour à l'accueil </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.cancel-container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
}

.cancel-box {
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 3rem 2rem;
  background: #fffbeb;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #d97706;
}

p {
  font-size: 1.125rem;
  color: #666;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 2rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
}

.button.primary {
  background: #635bff;
  color: white;
}

.button.primary:hover {
  background: #4f46e5;
}

.button.secondary {
  background: white;
  color: #635bff;
  border: 2px solid #635bff;
}

.button.secondary:hover {
  background: #f5f5ff;
}
</style>
