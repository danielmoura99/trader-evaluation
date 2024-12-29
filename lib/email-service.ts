// trader-evaluation/lib/email-service.ts
import nodemailer, { TransportOptions } from "nodemailer";

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
  try {
    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        '"Mesa Proprietária" <noreply@seudominio.com>',
      // Para produção:
      // to: customerEmail,
      // Para teste:
      to: "daniel.sousa.dsm@gmail.com",
      subject: "Complete seu Cadastro - Mesa Proprietária",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1f2937; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Mesa Proprietária</h1>
          </div>
          
          <div style="padding: 20px; background-color: #ffffff; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Bem-vindo(a)!</h2>
            
            <p style="color: #4b5563; line-height: 1.5;">Olá ${customerName},</p>
            
            <p style="color: #4b5563; line-height: 1.5;">
              Seu pagamento foi confirmado com sucesso. Para completar seu cadastro 
              e iniciar sua avaliação, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Completar Cadastro
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Este link é exclusivo para você e pode ser usado apenas uma vez.
              Se precisar de ajuda, entre em contato com nosso suporte.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      `,
    });

    console.log("[Email Service] Email de registro enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Service] Erro ao enviar email:", error);
    throw error;
  }
}
