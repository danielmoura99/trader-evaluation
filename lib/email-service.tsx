// trader-evaluation/lib/email-service.ts
import { render } from "@react-email/components";
import nodemailer, { TransportOptions } from "nodemailer";
import { RegistrationEmail } from "emails/registration-email";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as TransportOptions);

interface SendRegistrationEmailParams {
  customerName: string;
  customerEmail: string;
  registrationUrl: string;
}

export async function sendRegistrationEmail({
  customerName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  customerEmail,
  registrationUrl,
}: SendRegistrationEmailParams) {
  const emailHtml = await render(
    <RegistrationEmail
      customerName={customerName}
      registrationUrl={registrationUrl}
    />
  );

  const info = await transporter.sendMail({
    from:
      process.env.EMAIL_FROM || '"Traders House" <noreply@tradershouse.com>',
    to: "daniel.sousa.dsm@gmail.com",
    subject: "Complete seu Cadastro - Traders House",
    html: emailHtml,
  });

  return { success: true, messageId: info.messageId };
}
