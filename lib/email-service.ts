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
        process.env.EMAIL_FROM || '"Traders House" <noreply@tradershouse.com>',
      // to: customerEmail, // Produção
      to: "daniel.sousa.dsm@gmail.com", // Teste
      subject: "Complete seu Cadastro - Traders House",
      html: `
            <div style="background-color: #121212; color: #ffffff; font-family: Arial, sans-serif; margin: 0; padding: 0;">
              <!-- Header -->
              <div style="background: linear-gradient(to bottom, #1a1a1a, #121212); padding: 40px 20px; text-align: center;">
                <img src="https://trader-evaluation.vercel.app/images/Topo de Email-01.png" alt="Traders House" style="max-width: 200px; margin-bottom: 20px;">
                <div style="color: rgba(255,255,255,0.9); font-size: 16px;">Mesa Proprietária</div>
              </div>
    
              <!-- Content -->
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h2 style="color: #2fd82f; margin-bottom: 30px; font-size: 24px;">Bem-vindo(a) à Traders House!</h2>
                
                <p style="color: rgba(255,255,255,0.9); line-height: 1.6; margin-bottom: 20px;">
                  Olá ${customerName},
                </p>
                
                <p style="color: rgba(255,255,255,0.9); line-height: 1.6; margin-bottom: 30px;">
                  Seu pagamento foi confirmado com sucesso. Agora você está a um passo de começar sua jornada como trader.
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${registrationUrl}" 
                     style="background-color: #2fd82f;
                            color: #000000;
                            padding: 16px 32px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                            display: inline-block;
                            transition: all 0.3s ease;">
                    Completar Cadastro
                  </a>
                </div>
                
                <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 30px; text-align: center;">
                  Este link é exclusivo para você e pode ser usado apenas uma vez.
                </p>
              </div>
    
              <!-- Footer -->
              <div style="background: #1a1a1a; padding: 20px; text-align: center; color: rgba(255,255,255,0.6);">
                <p style="font-size: 12px; margin: 0;">
                  © 2024 Traders House. Todos os direitos reservados
                </p>
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
