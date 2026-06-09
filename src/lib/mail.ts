import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp-relay.brevo.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'LetLoyal'}" <${process.env.SMTP_FROM || 'noreply@letloyal.com'}>`,
    to,
    subject,
    html,
  });
}

// ── Email templates ───────────────────────────────────────────────────────────

function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LetLoyal</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0D9488;padding:28px 32px;text-align:center;">
            <svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:10px;">
              <rect width="32" height="32" rx="7" fill="rgba(255,255,255,0.15)"/>
              <line x1="8" y1="6" x2="8" y2="25" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
              <line x1="8" y1="25" x2="20" y2="25" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
              <line x1="14" y1="19" x2="27" y2="6" stroke="#CCFBF1" stroke-width="3.5" stroke-linecap="round"/>
              <polyline points="20,6 27,6 27,13" stroke="#CCFBF1" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="color:#ffffff;font-size:22px;font-weight:800;vertical-align:middle;letter-spacing:-0.3px;">LetLoyal</span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px 32px 24px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Powered by LetLoyal · <a href="https://pilot.letloyal.com" style="color:#0D9488;text-decoration:none;">pilot.letloyal.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendCustomerWelcome(to: string, name: string): Promise<void> {
  const firstName = name.split(' ')[0];
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Welcome, ${firstName}! 🎉</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      Your LetLoyal rewards account is ready. Scan a QR code at any participating store to start earning stamps and unlocking rewards.
    </p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#0f766e;font-weight:600;">Here's how it works:</p>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:14px;color:#134e4a;line-height:1.8;">
        <li>Scan the store's QR code at checkout</li>
        <li>Earn stamps or points with every visit</li>
        <li>Hit your milestone and redeem your reward!</li>
      </ul>
    </div>
    <a href="https://pilot.letloyal.com/my-rewards"
       style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px;">
      View My Rewards →
    </a>
  `);
  await sendMail({ to, subject: `Welcome to LetLoyal, ${firstName}! 🌟`, html });
}

export async function sendMerchantWelcome(
  to: string,
  businessName: string,
  loginEmail: string,
  tempPassword: string,
  slug: string,
): Promise<void> {
  const dashboardUrl = `https://pilot.letloyal.com/m/${slug}`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Welcome to LetLoyal! 🚀</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
      Your merchant account for <strong>${businessName}</strong> has been created. You can now set up your loyalty campaign and start rewarding customers.
    </p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:14px;color:#0f766e;font-weight:600;">Your login details</p>
      <table style="font-size:14px;color:#134e4a;width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;width:90px;color:#6b7280;">Email</td>
          <td style="padding:4px 0;font-weight:600;">${loginEmail}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6b7280;">Password</td>
          <td style="padding:4px 0;font-weight:600;font-family:monospace;letter-spacing:0.5px;">${tempPassword}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6b7280;">Dashboard</td>
          <td style="padding:4px 0;"><a href="${dashboardUrl}" style="color:#0D9488;text-decoration:none;font-weight:600;">${dashboardUrl}</a></td>
        </tr>
      </table>
    </div>
    <p style="margin:0 0 20px;font-size:13px;color:#9ca3af;">Please change your password after your first login.</p>
    <a href="${dashboardUrl}"
       style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px;">
      Go to Dashboard →
    </a>
  `);
  await sendMail({ to, subject: `Your LetLoyal merchant account is ready — ${businessName}`, html });
}
