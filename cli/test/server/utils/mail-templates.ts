// Templates d'emails
// Ajoutez vos propres templates ici

const templates: Record<string, (data: Record<string, string>) => string> = {
  welcome: (data) => `
    <h1>Bienvenue ${data.name} !</h1>
    <p>Votre compte a été créé avec succès.</p>
    ${data.confirmUrl ? `<p><a href="${data.confirmUrl}">Confirmer votre email</a></p>` : ''}
  `,

  'reset-password': (data) => `
    <h1>Réinitialisation du mot de passe</h1>
    <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
    <p><a href="${data.resetUrl}">Réinitialiser mon mot de passe</a></p>
    <p>Ce lien expire dans 1 heure.</p>
  `,
};

export function renderTemplate(templateName: string, data: Record<string, string>): string {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Template "${templateName}" introuvable`);
  }
  return template(data);
}
