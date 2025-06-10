// lib/services/direct-service.ts
import { prisma } from "@/lib/prisma";
import nodemailer, { TransportOptions } from "nodemailer";
import { PagarmePaymentData } from "@/app/types/pagarme-webhook";
import { TraderStatus, PaidAccountStatus } from "@/app/types";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as TransportOptions);

interface ProcessDirectParams {
  paymentData: PagarmePaymentData;
  hublaPaymentId: string;
}

/**
 * Processa uma compra de plano DIRETO (Novo Cenário)
 * Cliente pula a avaliação e vai direto para contas remuneradas
 */
export async function processDirect({
  paymentData,
  hublaPaymentId,
}: ProcessDirectParams) {
  try {
    console.log("[Direct Service] Processando plano DIRETO...");
    console.log("[Direct Service] Dados recebidos:", {
      plan: paymentData.plan,
      platform: paymentData.platform,
      customerName: paymentData.customerName,
      orderId: hublaPaymentId,
    });

    // ✅ 1. Criar cliente normal com status "Direto"
    const client = await prisma.client.create({
      data: {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        cpf: paymentData.customerDocument.replace(/\D/g, ""), // Limpar CPF
        phone: paymentData.customerPhone,
        birthDate: new Date(), // Data padrão - será atualizada no registro
        address: "", // Será preenchido no registro
        zipCode: "", // Será preenchido no registro
        platform: paymentData.platform,
        plan: paymentData.plan,
        traderStatus: TraderStatus.DIRECT, // ✅ Status "Direto"
        startDate: new Date(),
        observation: "Cliente direto - sem avaliação necessária",
      },
    });

    console.log("[Direct Service] Cliente criado:", {
      clientId: client.id,
      name: client.name,
      status: client.traderStatus,
    });

    // ✅ 2. Automaticamente criar conta remunerada
    const paidAccount = await prisma.paidAccount.create({
      data: {
        clientId: client.id,
        platform: paymentData.platform,
        plan: paymentData.plan,
        status: PaidAccountStatus.WAITING, // Aguardando liberação
      },
    });

    console.log("[Direct Service] Conta remunerada criada:", {
      paidAccountId: paidAccount.id,
      clientId: client.id,
      status: paidAccount.status,
    });

    // ✅ 3. Gerar URL de registro específica para diretos
    const registrationUrl = `${process.env.CLIENT_PORTAL_URL}/registration/${hublaPaymentId}?isDirect=true`;

    console.log("[Direct Service] URL de registro gerada:", registrationUrl);

    // ✅ 4. Enviar email específico para clientes diretos
    const emailResult = await sendDirectEmail({
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      registrationUrl,
      planName: paymentData.plan,
      platform: paymentData.platform,
    });

    const result = {
      success: true,
      type: "direct",
      clientId: client.id,
      paidAccountId: paidAccount.id,
      registrationUrl,
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
      planDetails: {
        plan: paymentData.plan,
        platform: paymentData.platform,
        skipEvaluation: true,
      },
    };

    console.log("[Direct Service] Processamento concluído:", result);
    return result;
  } catch (error) {
    console.error("[Direct Service] Erro ao processar plano direto:", error);
    return {
      success: false,
      type: "direct",
      error: error instanceof Error ? error.message : "Erro desconhecido",
      emailSent: false,
    };
  }
}

/**
 * Envia email específico para clientes de planos diretos
 */
async function sendDirectEmail({
  customerName,
  customerEmail,
  registrationUrl,
  planName,
  platform,
}: {
  customerName: string;
  customerEmail: string;
  registrationUrl: string;
  planName: string;
  platform: string;
}) {
  try {
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao ${planName} - Traders House</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
            .cta-button { display: inline-block; background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .direct-badge { background: #9b59b6; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Pagamento Confirmado!</h1>
                <p>Bem-vindo ao <strong>${planName}</strong></p>
                <span class="direct-badge">⚡ ACESSO DIRETO</span>
            </div>
            
            <div class="content">
                <p>Olá <strong>${customerName}</strong>,</p>
                
                <p>Parabéns! Seu pagamento foi confirmado e você adquiriu um plano com <strong>acesso direto</strong> às contas remuneradas.</p>
                
                <div class="highlight">
                    <h3>🎉 Vantagem do Plano Direto:</h3>
                    <p><strong>Sem avaliação necessária!</strong> Você pulará a etapa de avaliação e terá acesso direto à conta remunerada na plataforma ${platform}.</p>
                </div>
                
                <h3>📋 Próximos Passos:</h3>
                <ol>
                    <li><strong>Complete seu cadastro</strong> clicando no botão abaixo</li>
                    <li><strong>Preencha seus dados</strong> para ativação da conta</li>
                    <li><strong>Aguarde a liberação</strong> da sua conta remunerada</li>
                    <li><strong>Comece a operar</strong> imediatamente!</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="${registrationUrl}" class="cta-button">
                        ⚡ Completar Cadastro e Ativar Conta
                    </a>
                </div>
                
                <div class="highlight">
                    <h4>💜 Detalhes do Seu Plano:</h4>
                    <ul>
                        <li><strong>Plano:</strong> ${planName}</li>
                        <li><strong>Plataforma:</strong> ${platform}</li>
                        <li><strong>Tipo:</strong> Acesso Direto (sem avaliação)</li>
                        <li><strong>Status:</strong> Aguardando ativação</li>
                    </ul>
                </div>
                
                <p><strong>Importante:</strong> Complete seu cadastro o mais rápido possível para que possamos liberar sua conta remunerada.</p>
                
                <p>Em caso de dúvidas, entre em contato conosco.</p>
                
                <p>Bem-vindo à Traders House! 🚀</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #666;">
                    Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                    <a href="${registrationUrl}">${registrationUrl}</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `🚀 Bem-vindo ao ${planName} - Acesso Direto Confirmado!`,
      html: emailHtml,
    });

    console.log("[Direct Service] Email enviado:", {
      messageId: info.messageId,
      to: customerEmail,
      planName,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("[Direct Service] Erro ao enviar email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
