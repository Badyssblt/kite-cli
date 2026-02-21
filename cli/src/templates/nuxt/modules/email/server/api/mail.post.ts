import { sendMail } from '~~/server/utils/mail';
import { renderTemplate } from '~~/server/utils/mail-templates';

export default defineEventHandler(async (event) => {
  const { to, subject, template, data, html } = await readBody(event);

  if (!to || !subject) {
    throw createError({ statusCode: 400, statusMessage: 'to et subject sont requis' });
  }

  // Soit un template nommé, soit du HTML brut
  const mailHtml = template ? renderTemplate(template, data || {}) : html;

  if (!mailHtml) {
    throw createError({ statusCode: 400, statusMessage: 'template ou html requis' });
  }

  const info = await sendMail({ to, subject, html: mailHtml });

  return { success: true, messageId: info.messageId };
});
