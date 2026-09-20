// Shared branded email layout, used by the transactional Netlify functions.
// The logo is loaded from the public site (public/logo.png deployed to the
// production domain) so it renders in clients that don't support data URIs.
export const EMAIL_MESSAGES = {
  en: {
    subject: (group) => `You've been invited to join ${group} on Triathlon Tippspiel`,
    title: "You're invited!",
    offer: (inviter, group) =>
      `${inviter} has invited you to join <strong>${group}</strong> on Triathlon Tippspiel. Create or compare your race predictions with friends and see who comes out on top.`,
    cta: 'Accept invite',
    footer: 'You are receiving this because an admin of your group invited you to join.'
  },
  de: {
    subject: (group) => `Du wurdest eingeladen, ${group} auf Triathlon Tippspiel beizutreten`,
    title: 'Du bist eingeladen!',
    offer: (inviter, group) =>
      `${inviter} hat dich eingeladen, <strong>${group}</strong> auf Triathlon Tippspiel beizutreten. Erstelle oder vergleiche deine Tipps mit Freunden und finde heraus, wer am Ende ganz oben steht.`,
    cta: 'Einladung annehmen',
    footer: 'Du erhältst diese E-Mail, weil ein Admin deiner Gruppe dich eingeladen hat.'
  }
}

export function buildEmail({ logoUrl, title, offer = '', ctaLabel, ctaUrl, footer = '' }) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;-webkit-text-size-adjust:100%;">
    <center style="width:100%;table-layout:fixed;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${logoUrl}" width="56" height="56" alt="Triathlon Tippspiel"
                style="display:block;border-radius:14px;outline:none;border:0;" />
              <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;color:#111827;">
                Triathlon Tippspiel
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);padding:40px 40px 32px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${title}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${offer}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                <tr>
                  <td>
                    <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;padding:14px 28px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;margin:0;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#9ca3af;word-break:break-all;">
                Or copy and paste this link into your browser:<br />
                <a href="${ctaUrl}" style="color:#6366f1;text-decoration:underline;">${ctaUrl}</a>
              </p>
              ${footer ? `<p style="margin:0;padding-top:24px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;line-height:1.5;">${footer}</p>` : ''}
            </td>
          </tr>
        </table>
      </div>
    </center>
  </body>
</html>
`.trim()
}
