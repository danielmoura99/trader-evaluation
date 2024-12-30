// emails/registration-email.tsx
import {
  Html,
  Container,
  Text,
  Button,
  Head,
  Preview,
  Body,
  Section,
  Img,
} from "@react-email/components";
import * as React from "react";

interface RegistrationEmailProps {
  customerName: string;
  registrationUrl: string;
}

export const RegistrationEmail = ({
  customerName,
  registrationUrl,
}: RegistrationEmailProps) => (
  <Html>
    <Head />
    <Preview>Complete seu Cadastro - Traders House</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="/logo.png"
            width="150"
            height="35"
            alt="Traders House"
            style={logo}
          />
          <Text style={subtitle}>Mesa Proprietária</Text>
        </Section>

        <Section style={content}>
          <Text style={heading}>Bem-vindo(a) à Traders House!</Text>

          <Text style={paragraph}>Olá {customerName},</Text>

          <Text style={paragraph}>
            Seu pagamento foi confirmado com sucesso. Agora você está a um passo
            de começar sua jornada na mesa propietária da traders house. Clique
            no botão abaixo para completar seu cadastro e iniciar sua avaliação.
          </Text>

          <Button style={button} href={registrationUrl}>
            Completar Cadastro
          </Button>

          <Text style={disclaimer}>
            Este link é exclusivo para você e pode ser usado apenas uma vez. Se
            precisar de ajuda, entre em contato conosco nosso suporte.
          </Text>
        </Section>

        <Text style={autoMessage}>
          Este é um email automático, por favor não responda.
        </Text>

        <Section style={footer}>
          <Text style={copyright}>
            © 2024 Traders House. Todos os direitos reservados
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#121212",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0",
  width: "600px",
};

const header = {
  textAlign: "center" as const,
  padding: "20px",
};

const logo = {
  display: "block",
  margin: "0 auto",
};

const subtitle = {
  color: "#ffffff",
  fontSize: "14px",
  marginTop: "10px",
};

const content = {
  padding: "20px 30px",
};

const heading = {
  color: "#2fd82f",
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "20px",
  textAlign: "left" as const,
};

const paragraph = {
  color: "#ffffff",
  fontSize: "14px",
  lineHeight: "24px",
  marginBottom: "20px",
};

const button = {
  backgroundColor: "#2fd82f",
  borderRadius: "4px",
  color: "#000000",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  margin: "30px 0",
};

const disclaimer = {
  color: "#888888",
  fontSize: "12px",
  marginTop: "20px",
  textAlign: "center" as const,
};

const autoMessage = {
  color: "#6b7280",
  fontSize: "11px",
  textAlign: "center" as const,
  padding: "20px",
};

const footer = {
  borderTop: "1px solid #333333",
  padding: "20px",
  textAlign: "center" as const,
};

const copyright = {
  color: "#888888",
  fontSize: "12px",
  margin: 0,
};

export default RegistrationEmail;
