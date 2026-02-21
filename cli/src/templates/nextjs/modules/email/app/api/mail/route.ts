import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';
import { renderTemplate } from '@/lib/mail-templates';

export async function POST(request: NextRequest) {
  const { to, subject, template, data, html } = await request.json();

  if (!to || !subject) {
    return NextResponse.json({ error: 'to et subject sont requis' }, { status: 400 });
  }

  // Soit un template nommé, soit du HTML brut
  const mailHtml = template ? renderTemplate(template, data || {}) : html;

  if (!mailHtml) {
    return NextResponse.json({ error: 'template ou html requis' }, { status: 400 });
  }

  try {
    const info = await sendMail({ to, subject, html: mailHtml });
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
