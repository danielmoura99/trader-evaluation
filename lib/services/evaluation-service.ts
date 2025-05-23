// lib/services/evaluation-service.ts
//import { prisma } from "@/lib/prisma";
import nodemailer, { TransportOptions } from "nodemailer";
import { PagarmePaymentData } from "@/app/types/pagarme-webhook";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as TransportOptions);

interface ProcessEvaluationParams {
  paymentData: PagarmePaymentData;
  hublaPaymentId: string;
}

/**
 * Processa uma compra de avaliação (Cenário 1)
 */
export async function processEvaluation({
  paymentData,
  hublaPaymentId,
}: ProcessEvaluationParams) {
  try {
    console.log("[Evaluation Service] Processando avaliação simples");

    // Gera URL para cadastro
    const orderBumps = paymentData.metadata.orderBumps;
    let registrationUrl = `${process.env.CLIENT_PORTAL_URL}/registration/${hublaPaymentId}`;

    // Se existem order bumps, adiciona os courseIds na URL
    if (orderBumps && orderBumps.courseIds && orderBumps.courseIds.length > 0) {
      const additionalCourseIds = orderBumps.courseIds.join(",");
      registrationUrl += `?orderBumpCourseIds=${additionalCourseIds}`;
    }

    // Envia email de registro
    const emailResult = await sendEvaluationEmail({
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      registrationUrl,
    });

    return {
      success: true,
      type: "evaluation",
      registrationUrl,
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
    };
  } catch (error) {
    console.error("[Evaluation Service] Erro ao processar avaliação:", error);
    throw error;
  }
}

interface SendEvaluationEmailParams {
  customerName: string;
  customerEmail: string;
  registrationUrl: string;
}

/**
 * Envia email para compra de avaliação
 */
async function sendEvaluationEmail({
  customerName,
  customerEmail,
  registrationUrl,
}: SendEvaluationEmailParams) {
  try {
    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || '"Traders House" <noreply@tradershouse.com>',
      to: customerEmail,
      subject: "Complete seu Cadastro - Traders House",
      html: `
        <div style="max-width: 600px; margin: 0 auto; background-color: #121212; color: #ffffff; font-family: Arial, sans-serif;">
          <!-- Conteúdo Principal -->
          <div style="padding: 20px 30px;">
            <h1 style="color: #2fd82f; font-size: 24px; margin-bottom: 20px;">
              Bem-vindo(a) à Traders House!
            </h1>
            
            <p style="color: #ffffff; font-size: 16px; margin-bottom: 15px;">
              Olá ${customerName},
            </p>
            
            <p style="color: #ffffff; font-size: 14px; margin-bottom: 25px;">
              Seu pagamento foi confirmado com sucesso. Agora você está a um passo de começar sua jornada na mesa proprietária da Traders House. Clique no botão abaixo para completar seu cadastro e iniciar sua avaliação.
            </p>
            
            <!-- Botão -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}" 
                 style="background-color: #2fd82f;
                        color: #000000;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 14px;">
                Completar Cadastro
              </a>
            </div>

            <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 25px;">
              Este link é exclusivo para você e pode ser usado apenas uma vez. Se precisar de ajuda, entre em contato com nosso suporte.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 11px;">
            <p>Este é um email automático, por favor não responda.</p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #333333; padding: 20px; text-align: center;">
            <p style="color: #888888; font-size: 12px; margin: 0;">
              © 2024 Traders House. Todos os direitos reservados
            </p>
          </div>
        </div>
      `,
    });

    console.log(
      "[Evaluation Service] Email de registro enviado:",
      info.messageId
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Evaluation Service] Erro ao enviar email:", error);
    return { success: false, error };
  }
}
