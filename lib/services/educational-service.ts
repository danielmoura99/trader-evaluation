// lib/services/educational-service.ts
//import { prisma } from "@/lib/prisma";
import nodemailer, { TransportOptions } from "nodemailer";
import { PagarmePaymentData } from "@/app/types/pagarme-webhook";
import axios from "axios";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as TransportOptions);

interface ProcessEducationalParams {
  paymentData: PagarmePaymentData;
  hublaPaymentId: string;
}

/**
 * Processa uma compra apenas educacional (Cenário 3)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processEducational({
  paymentData,
  //hublaPaymentId,
}: ProcessEducationalParams) {
  try {
    console.log("[Educational Service] Processando produto educacional");

    // Extrai informações do curso/produto educacional
    const courseId = paymentData.metadata.courseId || "";
    const courseName =
      paymentData.metadata.productName || "Produto Educacional";

    // Verifica order bumps (produtos adicionais)
    const orderBumps = paymentData.metadata.orderBumps;
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

    // Verificar se o usuário já existe no client-portal (por email ou CPF)
    const existingUser = await checkExistingUser(
      paymentData.customerEmail,
      paymentData.customerDocument
    );
    const isNewUser = !existingUser;

    // Se o usuário não existir, criamos no client-portal
    let userId = existingUser?.id;
    let credentials = null;

    if (!existingUser) {
      // Gerar uma senha aleatória para novo usuário
      const password = generateRandomPassword();

      // Criar usuário no client-portal
      const newUser = await createUser({
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        document: paymentData.customerDocument,
        phone: paymentData.customerPhone,
        password,
      });

      userId = newUser.id;
      credentials = { email: paymentData.customerEmail, password };
    }

    // Liberar acesso aos cursos
    await grantCourseAccess({
      userId: userId!,
      mainCourseId: courseId,
      additionalCourseIds,
    });

    // Enviar email apropriado (com credenciais para novos usuários ou apenas notificação para existentes)
    const emailResult = await sendEducationalEmail({
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      courseDetails,
      isNewUser,
      credentials,
    });

    return {
      success: true,
      type: "educational",
      userId,
      isNewUser,
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
      courseDetails,
    };
  } catch (error) {
    console.error(
      "[Educational Service] Erro ao processar produto educacional:",
      error
    );
    throw error;
  }
}

/**
 * Verifica se o usuário já existe no client-portal
 */
async function checkExistingUser(email: string, document: string) {
  try {
    // Chama a API do client-portal para verificar se o usuário existe
    const response = await axios.get(
      `${process.env.CLIENT_PORTAL_API_URL}/api/check-user`,
      {
        params: { email, document },
        headers: {
          Authorization: `Bearer ${process.env.CLIENT_PORTAL_API_KEY}`,
        },
      }
    );

    if (response.data.exists) {
      return response.data.user;
    }

    return null;
  } catch (error) {
    console.error(
      "[Educational Service] Erro ao verificar usuário existente:",
      error
    );
    return null;
  }
}

/**
 * Cria um novo usuário no client-portal
 */
async function createUser(userData: {
  name: string;
  email: string;
  document: string;
  phone: string;
  password: string;
}) {
  try {
    const response = await axios.post(
      `${process.env.CLIENT_PORTAL_API_URL}/api/create-user`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLIENT_PORTAL_API_KEY}`,
        },
      }
    );

    return response.data.user;
  } catch (error) {
    console.error("[Educational Service] Erro ao criar usuário:", error);
    throw new Error("Falha ao criar usuário no client-portal");
  }
}

/**
 * Libera acesso aos cursos para um usuário
 */
async function grantCourseAccess({
  userId,
  mainCourseId,
  additionalCourseIds,
}: {
  userId: string;
  mainCourseId: string;
  additionalCourseIds: string[];
}) {
  try {
    // Junta todos os IDs de cursos
    const allCourseIds = [mainCourseId, ...additionalCourseIds].filter(
      (id) => id
    );

    if (allCourseIds.length === 0) {
      throw new Error("Nenhum ID de curso válido fornecido");
    }

    const response = await axios.post(
      `${process.env.CLIENT_PORTAL_API_URL}/api/grant-course-access`,
      {
        userId,
        courseIds: allCourseIds,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CLIENT_PORTAL_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "[Educational Service] Erro ao liberar acesso aos cursos:",
      error
    );
    throw new Error("Falha ao liberar acesso aos cursos");
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

interface SendEducationalEmailParams {
  customerName: string;
  customerEmail: string;
  courseDetails: CourseDetails;
  isNewUser: boolean;
  credentials: { email: string; password: string } | null;
}

/**
 * Gera uma senha aleatória para novos usuários
 */
function generateRandomPassword(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Envia email para compra de produto educacional
 */
async function sendEducationalEmail({
  customerName,
  customerEmail,
  courseDetails,
  isNewUser,
  credentials,
}: SendEducationalEmailParams) {
  try {
    // Prepara a lista de cursos para exibir no email
    let coursesHtml = `<li style="margin-bottom: 8px;">${courseDetails.mainCourse.name}</li>`;

    if (courseDetails.additionalCourses.length > 0) {
      courseDetails.additionalCourses.forEach((course) => {
        coursesHtml += `<li style="margin-bottom: 8px;">${course.name}</li>`;
      });
    }

    // Conteúdo diferente para usuários novos vs. existentes
    // eslint-disable-next-line prefer-const
    let subject = isNewUser
      ? "Suas Credenciais de Acesso aos Cursos - Traders House"
      : "Acesso Liberado aos Novos Cursos - Traders House";

    let credentialsHtml = "";

    if (isNewUser && credentials) {
      credentialsHtml = `
        <div style="background-color: #1a1a1a; border: 1px solid #333333; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="color: #ffffff; font-size: 14px; margin-bottom: 10px;">
            <strong>Suas credenciais de acesso:</strong>
          </p>
          <p style="color: #ffffff; font-size: 14px; margin-bottom: 5px;">
            Email: ${credentials.email}
          </p>
          <p style="color: #ffffff; font-size: 14px; margin-bottom: 5px;">
            Senha: ${credentials.password}
          </p>
          <p style="color: #ffd700; font-size: 12px; margin-top: 10px;">
            Por segurança, recomendamos que você altere sua senha no primeiro acesso.
          </p>
        </div>
      `;
    }

    const portalUrl =
      process.env.CLIENT_PORTAL_URL || "https://portal.tradershouse.com.br";

    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || '"Traders House" <noreply@tradershouse.com>',
      to: customerEmail,
      subject,
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
              Seu pagamento foi confirmado com sucesso. Você adquiriu acesso aos seguintes conteúdos educacionais:
            </p>
            
            <ul style="color: #ffffff; font-size: 14px; margin-bottom: 20px; padding-left: 20px;">
              ${coursesHtml}
            </ul>
            
            ${credentialsHtml}
            
            <p style="color: #ffffff; font-size: 14px; margin-bottom: 20px;">
              ${
                isNewUser
                  ? "Você pode acessar os cursos agora usando as credenciais acima."
                  : "O acesso aos novos cursos já foi liberado em sua conta existente."
              }
            </p>
            
            <!-- Botão -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}/login" 
                 style="background-color: #2fd82f;
                        color: #000000;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 14px;">
                Acessar Portal
              </a>
            </div>

            <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 25px;">
              Se precisar de ajuda, entre em contato com nosso suporte.
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

    console.log("[Educational Service] Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Educational Service] Erro ao enviar email:", error);
    return { success: false, error };
  }
}
