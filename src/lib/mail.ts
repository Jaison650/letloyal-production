import nodemailer from 'nodemailer';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pilot.letloyal.com';

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

// ── Brand kit constants ───────────────────────────────────────────────────────
// Direction 1 — Trustworthy Teal SaaS (primary)
// Colors: #134E4A (dark teal) · #0D9488 (primary) · #5EEAD4 (mint) · #CCFBF1 (mint-light)
//         #0F172A (navy/body) · #64748B (slate/secondary) · #F0FDF4 (tint bg)
// Gradients: Forest 135deg #134E4A→#0D9488 (headers) · Night 135deg #0F172A→#134E4A
// Fonts: Plus Jakarta Sans (headings, brand) · Inter (body, UI)

// Horizontal wordmark logo SVG for emails (dark/teal bg version)
const EMAIL_LOGO_SVG = `
<svg width="180" height="44" viewBox="0 0 260 64" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <line x1="14" y1="8" x2="14" y2="48" stroke="white" stroke-width="7.5" stroke-linecap="round"/>
  <line x1="14" y1="48" x2="38" y2="48" stroke="white" stroke-width="7.5" stroke-linecap="round"/>
  <line x1="24" y1="37" x2="48" y2="10" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round"/>
  <polyline points="37,10 48,10 48,22" stroke="#5EEAD4" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="68" y="44" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="30" font-weight="700" fill="white" letter-spacing="-0.5">
    <tspan font-weight="500" fill="#5EEAD4">Let</tspan>Loyal
  </text>
</svg>`;

// ── Email templates ───────────────────────────────────────────────────────────

function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>LetLoyal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F0FDF4;font-family:'Inter',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(13,148,136,0.10);">

        <!-- ── Header (Forest gradient from brand kit) ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#134E4A 0%,#0D9488 100%);padding:32px 36px;">
            ${EMAIL_LOGO_SVG}
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 36px 28px;font-family:'Inter',Arial,sans-serif;color:#0F172A;">
            ${body}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="padding:20px 36px 32px;text-align:center;border-top:1px solid #E2E8F0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <svg width="14" height="14" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:5px;">
                    <rect width="32" height="32" rx="7" fill="#0D9488"/>
                    <line x1="8" y1="6" x2="8" y2="25" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
                    <line x1="8" y1="25" x2="20" y2="25" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
                    <line x1="14" y1="19" x2="27" y2="6" stroke="#CCFBF1" stroke-width="3.5" stroke-linecap="round"/>
                    <polyline points="20,6 27,6 27,13" stroke="#CCFBF1" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:12px;font-weight:700;color:#64748B;vertical-align:middle;letter-spacing:-0.01em;">
                    <span style="font-weight:500;color:#0D9488;">Let</span>Loyal
                  </span>
                  <span style="font-size:12px;color:#94A3B8;margin:0 6px;">·</span>
                  <a href="${BASE_URL}" style="font-size:12px;color:#0D9488;text-decoration:none;">${BASE_URL.replace('https://', '')}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Brand-kit heading style
const H2 = `font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:24px;font-weight:800;color:#0F172A;margin:0 0 10px;letter-spacing:-0.02em;line-height:1.2`;
// Body paragraph style
const P  = `font-family:'Inter',Arial,sans-serif;font-size:15px;color:#64748B;line-height:1.65;margin:0 0 22px`;
// Info box — mint-light tint (brand: #CCFBF1 border, #F0FDF4 bg)
const BOX = `background:#F0FDF4;border:1.5px solid #CCFBF1;border-radius:14px;padding:18px 22px;margin-bottom:26px`;
// CTA button — primary teal
const BTN = `display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-weight:700;font-size:15px;padding:14px 30px;border-radius:10px;letter-spacing:-0.01em`;

export async function sendCustomerResetPassword(to: string, name: string, resetUrl: string): Promise<void> {
  const firstName = name?.split(' ')[0] ?? 'there';
  const html = baseTemplate(`
    <h2 style="${H2}">Reset your password</h2>
    <p style="${P}">Hi ${firstName},</p>
    <p style="${P}">We received a request to reset your LetLoyal account password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
    <a href="${resetUrl}" style="${BTN}">Reset Password →</a>
    <p style="margin:24px 0 0;font-size:13px;color:#94A3B8;font-family:'Inter',Arial,sans-serif;">If you didn&apos;t request this, you can safely ignore this email. Your password won&apos;t change.</p>
  `);
  await sendMail({ to, subject: 'Reset your LetLoyal password', html });
}

export async function sendMerchantResetPassword(
  to: string,
  businessName: string,
  resetUrl: string,
  ttlMinutes: number,
): Promise<void> {
  const html = baseTemplate(`
    <h2 style="${H2}">Reset your password</h2>
    <p style="${P}">Hi ${businessName},</p>
    <p style="${P}">We received a request to reset your LetLoyal merchant account password. Click the button below — this link expires in <strong>${ttlMinutes} minutes</strong>.</p>
    <a href="${resetUrl}" style="${BTN}">Reset Password →</a>
    <p style="margin:24px 0 0;font-size:13px;color:#94A3B8;font-family:'Inter',Arial,sans-serif;">If you didn&apos;t request this, you can safely ignore this email. Your password won&apos;t change.</p>
  `);
  await sendMail({ to, subject: 'Reset your LetLoyal merchant password', html });
}

export async function sendCustomerWelcome(to: string, name: string): Promise<void> {
  const firstName = name.split(' ')[0];
  const html = baseTemplate(`
    <h2 style="${H2}">Welcome, ${firstName}! 🎉</h2>
    <p style="${P}">
      Your LetLoyal rewards account is ready. Scan a QR code at any participating store to start earning stamps and unlocking rewards — no app download needed.
    </p>
    <div style="${BOX}">
      <p style="margin:0 0 10px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;font-weight:700;color:#134E4A;">Here&apos;s how it works:</p>
      <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#0F172A;font-family:'Inter',Arial,sans-serif;">
        <tr><td style="padding:5px 0;"><span style="color:#0D9488;font-weight:700;margin-right:8px;">1.</span>Scan the store&apos;s QR code at checkout</td></tr>
        <tr><td style="padding:5px 0;"><span style="color:#0D9488;font-weight:700;margin-right:8px;">2.</span>Earn stamps or points with every visit</td></tr>
        <tr><td style="padding:5px 0;"><span style="color:#0D9488;font-weight:700;margin-right:8px;">3.</span>Hit your milestone and redeem your reward!</td></tr>
      </table>
    </div>
    <a href="${BASE_URL}/my-rewards" style="${BTN}">View My Rewards →</a>
  `);
  await sendMail({ to, subject: `Welcome to LetLoyal, ${firstName}! 🌟`, html });
}

// loginEmail kept in signature for backwards-compatibility with existing call sites.
export async function sendMerchantWelcome(
  to: string,
  businessName: string,
  loginEmail: string,
  slug: string,
): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0ea5e9;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">LetLoyal</div>
              <div style="color:#bae6fd;font-size:14px;margin-top:4px;">India's Simplest Loyalty Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 32px;">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;">
                Welcome, ${businessName}! 🎉
              </h1>
              <p style="margin:0 0 28px 0;color:#475569;font-size:15px;line-height:1.6;">
                Your LetLoyal merchant account is live. Follow these 3 steps to start rewarding your customers today.
              </p>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="48" valign="top">
                    <div style="width:40px;height:40px;background:#0ea5e9;border-radius:50%;font-size:18px;font-weight:700;color:#fff;text-align:center;line-height:40px;">1</div>
                  </td>
                  <td style="padding-left:16px;">
                    <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">Complete your store profile</div>
                    <div style="font-size:14px;color:#64748b;line-height:1.5;">Add your logo, business hours, and store location so customers can find and recognise you.</div>
                    <a href="https://letloyal.in/m/${slug}/settings" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:#0ea5e9;text-decoration:none;">Set up profile →</a>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#f1f5f9;margin-bottom:20px;"></div>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="48" valign="top">
                    <div style="width:40px;height:40px;background:#0ea5e9;border-radius:50%;font-size:18px;font-weight:700;color:#fff;text-align:center;line-height:40px;">2</div>
                  </td>
                  <td style="padding-left:16px;">
                    <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">Create your first campaign</div>
                    <div style="font-size:14px;color:#64748b;line-height:1.5;">Set up a points campaign — decide how many points customers earn per ₹100 spent and what rewards they unlock.</div>
                    <a href="https://letloyal.in/m/${slug}/campaigns" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:#0ea5e9;text-decoration:none;">Create campaign →</a>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#f1f5f9;margin-bottom:20px;"></div>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="48" valign="top">
                    <div style="width:40px;height:40px;background:#0ea5e9;border-radius:50%;font-size:18px;font-weight:700;color:#fff;text-align:center;line-height:40px;">3</div>
                  </td>
                  <td style="padding-left:16px;">
                    <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">Get your QR code live</div>
                    <div style="font-size:14px;color:#64748b;line-height:1.5;">Download your store QR code and display it at your counter. When customers scan it, they join your loyalty program instantly — no app needed.</div>
                    <a href="https://letloyal.in/m/${slug}/qr" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:#0ea5e9;text-decoration:none;">Get QR code →</a>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://letloyal.in/m/${slug}" style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
                      Go to your dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                You're receiving this because you registered at <strong>letloyal.in</strong>.<br>
                Questions? Reply to this email — we read every message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  await sendMail({ to, subject: `Welcome to LetLoyal, ${businessName}! Your loyalty program is ready 🎉`, html });
}

export async function sendMerchantEmailOTP(to: string, businessName: string, otp: string): Promise<void> {
  const html = baseTemplate(`
    <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:#0F172A;margin:0 0 8px">Hello, ${businessName}!</p>
    <p style="${P}">Use the code below to verify your LetLoyal account. It expires in 10 minutes.</p>
    <div style="background:#F0FDF4;border:2px solid #0D9488;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px">
      <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:36px;font-weight:800;letter-spacing:12px;color:#0D9488;margin:0">${otp}</p>
    </div>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;color:#94A3B8;margin:0">If you did not create a LetLoyal account, ignore this email.</p>
  `);
  await sendMail({ to, subject: `${otp} — Your LetLoyal Verification Code`, html });
}

export async function sendNewMerchantAlert(merchantEmail: string, businessName: string, slug: string): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'hello@letloyal.com';
  const html = baseTemplate(`
    <p style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:#0F172A;margin:0 0 16px">New merchant verified on LetLoyal India</p>
    <div style="${BOX}">
      <table style="width:100%;border-collapse:collapse;font-family:'Inter',Arial,sans-serif;font-size:14px">
        <tr><td style="padding:8px;color:#64748B;width:140px">Business</td><td style="padding:8px;color:#0F172A;font-weight:600">${businessName}</td></tr>
        <tr style="border-top:1px solid #E2E8F0;"><td style="padding:8px;color:#64748B">Email</td><td style="padding:8px;color:#0F172A">${merchantEmail}</td></tr>
        <tr style="border-top:1px solid #E2E8F0;"><td style="padding:8px;color:#64748B">Slug</td><td style="padding:8px;color:#0D9488">/m/${slug}</td></tr>
      </table>
    </div>
  `);
  await sendMail({ to: adminEmail, subject: `New Merchant: ${businessName}`, html });
}
