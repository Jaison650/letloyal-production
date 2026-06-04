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
