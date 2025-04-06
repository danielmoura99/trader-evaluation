// lib/services/combo-service.ts
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

interface ProcessComboParams {
  paymentData: PagarmePaymentData;
  hublaPaymentId: string;
}

/**
 * Processa uma compra combinada de avaliação + educacional (Cenário 2)
 */
export async function processCombo({
  paymentData,
  hublaPaymentId,
}: ProcessComboParams) {
  try {
    console.log("[Combo Service] Processando combo avaliação + educacional");

    // Extrai informações do curso/produto educacional
    const courseId = paymentData.metadata.courseId || "";
    console.log("[Combo Service] courseId extraído:", courseId);
    const courseName =
      paymentData.metadata.productName || "Produto Educacional";

    // Verifica order bumps (produtos adicionais)
    const orderBumps = paymentData.metadata.orderBumps;
    console.log("[Combo Service] orderBumps:", orderBumps);
    const additionalCourseIds = orderBumps?.courseIds || [];
    const additionalCourseNames = orderBumps?.names || [];

    // Formata as informações dos cursos para exibição no email
    const courseDetails = {
      mainCourse: { id: courseId, name: courseName },
      additionalCourses: additionalCourseIds.map((id, index) => ({
        id,
        name: additionalCourseNames[index] || `Curso adicional ${index + 1}`,
      })),
    };

    // Gera URL para cadastro
    let registrationUrl = `${process.env.CLIENT_PORTAL_URL}/registration/${hublaPaymentId}?combo=true`;

    // Adiciona o courseId principal se existir
    if (courseId && courseId.trim() !== "") {
      registrationUrl += `&courseId=${courseId}`;
      console.log("[Combo Service] Adicionando courseId à URL:", courseId);
    } else {
      console.log("[Combo Service] courseId não encontrado ou vazio");
    }

    // Adiciona courseIds adicionais dos order bumps
    if (additionalCourseIds.length > 0) {
      registrationUrl += `&additionalCourseIds=${additionalCourseIds.join(",")}`;
      console.log(
        "[Combo Service] Adicionando additionalCourseIds à URL:",
        additionalCourseIds
      );
    }

    // Envia email de registro
    const emailResult = await sendComboEmail({
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      registrationUrl,
      courseDetails,
    });

    return {
      success: true,
      type: "combo",
      registrationUrl,
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
      courseDetails,
    };
  } catch (error) {
    console.error("[Combo Service] Erro ao processar combo:", error);
    throw error;
  }
}

interface CourseDetail {
  id: string;
  name: string;
}

interface CourseDetails {
  mainCourse: CourseDetail;
  additionalCourses: CourseDetail[];
}

interface SendComboEmailParams {
  customerName: string;
  customerEmail: string;
  registrationUrl: string;
  courseDetails: CourseDetails;
}

/**
 * Envia email para compra de combo (avaliação + educacional)
 */
async function sendComboEmail({
  customerName,
  customerEmail,
  registrationUrl,
  courseDetails,
}: SendComboEmailParams) {
  try {
    // Prepara a lista de cursos para exibir no email
    let coursesHtml = `<li style="margin-bottom: 8px;">${courseDetails.mainCourse.name}</li>`;

    if (courseDetails.additionalCourses.length > 0) {
      courseDetails.additionalCourses.forEach((course) => {
        coursesHtml += `<li style="margin-bottom: 8px;">${course.name}</li>`;
      });
    }

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
            
            <p style="color: #ffffff; font-size: 14px; margin-bottom: 15px;">
              Seu pagamento foi confirmado com sucesso. Você adquiriu nosso produto com acesso aos seguintes conteúdos educacionais:
            </p>
            
            <ul style="color: #ffffff; font-size: 14px; margin-bottom: 20px; padding-left: 20px;">
              ${coursesHtml}
            </ul>
            
            <p style="color: #ffffff; font-size: 14px; margin-bottom: 20px;">
              Para iniciar sua jornada na Traders House e ter acesso aos produtos, clique no botão abaixo para completar seu cadastro.
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

    console.log("[Combo Service] Email de registro enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Combo Service] Erro ao enviar email:", error);
    return { success: false, error };
  }
}
