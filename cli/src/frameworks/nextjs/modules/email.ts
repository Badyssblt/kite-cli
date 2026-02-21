import type { ModuleConfiguration, ModuleDefinition } from '../../../types';

export const emailModule: ModuleDefinition = {
  id: 'email',
  name: "Envoi d'emails avec Nodemailer",
  description: "Envoi d'emails simple et efficace avec Nodemailer et MailHog en dev",
  dependsOn: [],
  hasSetupScript: false,

  prompts: [
    {
      id: 'mailhog',
      type: 'confirm',
      message: 'Inclure MailHog pour le développement ?',
      default: true,
    },
  ],

  configure: (answers, context): ModuleConfiguration => {
    const includeMailhog = answers.mailhog as boolean;
    const hasDocker = context.selectedModules.includes('docker');
    const useMailhog = hasDocker && includeMailhog;

    const config: ModuleConfiguration = {
      dependencies: {
        nodemailer: 'latest',
      },
      devDependencies: {
        '@types/nodemailer': 'latest',
      },
      env: {
        SMTP_HOST: useMailhog ? 'mailhog' : 'smtp.example.com',
        SMTP_PORT: useMailhog ? '1025' : '587',
        SMTP_SECURE: 'false',
        SMTP_USER: '',
        SMTP_PASS: '',
        MAIL_FROM: 'MonApp <noreply@monapp.com>',
      },
    };

    if (useMailhog) {
      config.docker = {
        services: {
          mailhog: {
            image: 'mailhog/mailhog',
            ports: ['1025:1025', '8025:8025'],
            restart: 'unless-stopped',
          },
        },
      };
    }

    return config;
  },

  instructions: {
    title: 'Email (Nodemailer)',
    steps: [
      '1. Configurer les variables SMTP dans .env',
      '2. En dev avec MailHog: emails visibles sur http://localhost:8025',
      '3. Utiliser `sendMail()` depuis lib/mail.ts dans vos API routes',
      '4. Ajouter vos templates dans lib/mail-templates.ts',
    ],
    links: ['https://nodemailer.com/', 'https://github.com/mailhog/MailHog'],
  },
};
