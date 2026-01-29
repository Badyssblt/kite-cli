# Module Stripe pour Nuxt

Module d'intégration Stripe simple pour accepter des paiements dans votre application Nuxt.

## Configuration

### 1. Variables d'environnement

Copiez `.env.example` vers `.env` et configurez vos clés Stripe :

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_PUBLIC_KEY=pk_test_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook

# Application URL
APP_URL=http://localhost:3000
```

### 2. Obtenir vos clés Stripe

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans **Développeurs > Clés API**
3. Copiez vos clés de test (commencent par `sk_test_` et `pk_test_`)

### 3. Configurer les produits

1. Dans le dashboard Stripe, allez dans **Produits**
2. Créez vos produits et prix
3. Copiez les **Price ID** (commencent par `price_`)
4. Mettez à jour les `priceId` dans `app/pages/checkout.vue`

```ts
const products = [
  {
    id: 1,
    name: "Mon Produit",
    description: "Description",
    price: 999, // en centimes (9,99€)
    priceId: "price_XXXXXXXXXX", // Votre Price ID Stripe
  },
];
```

## Routes disponibles

- **`/checkout`** - Page de sélection et paiement des produits
- **`/success`** - Page de confirmation après paiement réussi
- **`/cancel`** - Page affichée si le paiement est annulé

## API Endpoints

### POST `/api/create-checkout-session`

Crée une session de paiement Stripe.

**Body:**
```json
{
  "priceId": "price_XXXXXXXXXX",
  "quantity": 1
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### GET `/api/verify-session?session_id=cs_xxx`

Vérifie le statut d'une session de paiement.

**Response:**
```json
{
  "status": "paid",
  "customerEmail": "client@example.com",
  "amountTotal": 999
}
```

### POST `/api/webhook`

Endpoint pour recevoir les webhooks Stripe. À configurer dans le dashboard Stripe.

## Webhooks (Production)

Pour recevoir les événements Stripe en production :

1. Dans le dashboard Stripe, allez dans **Développeurs > Webhooks**
2. Ajoutez un endpoint : `https://votre-domaine.com/api/webhook`
3. Sélectionnez les événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copiez le secret du webhook dans `STRIPE_WEBHOOK_SECRET`

## Test en local avec webhooks

Pour tester les webhooks en local, utilisez Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhook
```

## Personnalisation

### Modifier les produits

Éditez `app/pages/checkout.vue` pour ajouter/modifier vos produits.

### Gérer les paiements réussis

Éditez `server/api/webhook.post.ts` dans le case `checkout.session.completed` pour :
- Enregistrer la commande en base de données
- Envoyer un email de confirmation
- Activer un abonnement
- etc.

## Mode Production

Avant de passer en production :

1. Remplacez les clés de test par les clés de production
2. Configurez les webhooks en production
3. Testez le flux complet de paiement
4. Vérifiez que les montants sont corrects (en centimes)

## Sécurité

- ⚠️ Ne jamais exposer `STRIPE_SECRET_KEY` côté client
- ⚠️ Toujours valider les webhooks avec `stripe.webhooks.constructEvent`
- ⚠️ Vérifier les montants côté serveur, jamais côté client
