"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeModule = void 0;
exports.stripeModule = {
    id: 'stripe',
    name: 'Stripe (Paiements)',
    description: 'Intégration Stripe pour accepter des paiements en ligne',
    dependsOn: [],
    hasSetupScript: false,
    prompts: [
        {
            id: 'mode',
            type: 'select',
            message: 'Mode de paiement ?',
            choices: [
                { name: 'Paiement unique', value: 'payment', description: 'Pour vendre des produits/services' },
                { name: 'Abonnement', value: 'subscription', description: 'Pour des paiements récurrents' },
                { name: 'Les deux', value: 'both', description: 'Paiements uniques et abonnements' }
            ],
            default: 'payment'
        }
    ],
    configure: (answers, context) => {
        const env = {
            STRIPE_SECRET_KEY: 'sk_test_your_secret_key',
            STRIPE_PUBLIC_KEY: 'pk_test_your_public_key',
            STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret',
            APP_URL: 'http://localhost:3000'
        };
        const dependencies = {
            'stripe': '^17.5.0'
        };
        return {
            env,
            dependencies,
            devDependencies: {}
        };
    },
    instructions: {
        title: 'Stripe',
        steps: [
            '1. Créer un compte sur https://stripe.com',
            '2. Récupérer vos clés API (Développeurs > Clés API)',
            '3. Créer vos produits dans le dashboard Stripe',
            '4. Copier les Price ID dans app/checkout/page.tsx',
            '5. Configurer les webhooks pour la production',
            '6. Tester avec les cartes de test: 4242 4242 4242 4242'
        ],
        links: [
            'https://stripe.com/docs',
            'https://dashboard.stripe.com/test/apikeys'
        ]
    },
    docker: {
        services: {
            app: {
                environment: [
                    'STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}',
                    'STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}',
                    'STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}',
                    'APP_URL=${APP_URL}'
                ]
            }
        }
    }
};
