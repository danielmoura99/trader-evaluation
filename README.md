<div align="center">
  <h1>Trader Evaluation</h1>
  <p><strong>Sistema completo de gerenciamento para mesas proprietárias de traders</strong></p>
  
  ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
  ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
</div>

![Dashboard Preview](https://via.placeholder.com/1200x630/0A2540/FFFFFF?text=Trader+Evaluation+Dashboard)

> **Desenvolvido com tecnologias modernas, este CRM oferece controle total sobre o ciclo de vida de traders em avaliação: da captação e acompanhamento até a gestão de traders aprovados em contas remuneradas.**

## 📑 Índice

- [✨ Visão Geral](#-visão-geral)
- [🚀 Recursos e Funcionalidades](#-recursos-e-funcionalidades)
- [🛠️ Stack Tecnológica](#️-stack-tecnológica)
- [🔧 Configuração e Instalação](#-configuração-e-instalação)
- [📱 Responsividade](#-responsividade)
- [🌟 Roadmap e Recursos Futuros](#-roadmap-e-recursos-futuros)
- [🧪 Testes](#-testes)
- [📚 Documentação](#-documentação)
- [👥 Autor](#-autor)
- [📄 Licença](#-licença)

## ✨ Visão Geral

O **Trader Evaluation** é uma aplicação web completa para empresas que oferecem avaliações de traders para mesas proprietárias. O sistema gerencia todo o ciclo de vida:

1. 💰 **Processamento de pagamentos** - Integração com gateways de pagamento
2. 📊 **Avaliação de traders** - Acompanhamento de desempenho e métricas
3. 👨‍💼 **Gestão de contas remuneradas** - Para traders aprovados
4. 📈 **Análise e reengajamento** - Estratégias para traders reprovados

### Fluxo de Trabalho

```mermaid
graph TD
    A[Cliente Adquire Avaliação] -->|Webhook Pagamento| B(Registro no Sistema)
    B --> C{Avaliação}
    C -->|Em progresso| D[Acompanhamento]
    D --> E{Resultado}
    E -->|Aprovado| F[Conta Remunerada]
    E -->|Reprovado| G[Reengajamento]
    G -->|Nova tentativa| A
```

O sistema oferece uma interface de administração completa onde gestores podem monitorar o progresso dos traders, gerenciar contas, visualizar métricas de desempenho e automatizar processos de comunicação.

## 🚀 Recursos e Funcionalidades

<table>
  <tr>
    <td width="50%">
      <h3>📊 Dashboard Interativo</h3>
      <ul>
        <li>Visão consolidada das métricas principais</li>
        <li>Gráficos de desempenho e tendências</li>
        <li>Lista de atividades recentes</li>
        <li>Indicadores de status com alertas</li>
      </ul>
    </td>
    <td width="50%">
      <h3>👥 Gestão de Clientes</h3>
      <ul>
        <li>Banco de dados completo de traders</li>
        <li>Importação em massa via CSV</li>
        <li>Busca e filtragem avançadas</li>
        <li>Histórico de interações</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔄 Fluxo de Avaliação</h3>
      <ul>
        <li>Processo automatizado de início e fim</li>
        <li>Integração com plataformas de trading</li>
        <li>Cronograma com alertas de prazos</li>
        <li>Sistema de aprovação/reprovação</li>
      </ul>
    </td>
    <td width="50%">
      <h3>💸 Contas Remuneradas</h3>
      <ul>
        <li>Gestão de traders aprovados</li>
        <li>Controle de planos e plataformas</li>
        <li>Ativação e cancelamento de contas</li>
        <li>Monitoramento de performance</li>
      </ul>
    </td>
  </tr>
</table>

### Integrações Principais

- **Webhooks de Pagamento**: Hubla e Pagar.me
- **Email Automatizado**: Sistema de comunicação via Nodemailer
- **API RESTful**: Endpoints para integrações com sistemas externos

## 🛠️ Stack Tecnológica

<table>
  <tr>
    <th>Categoria</th>
    <th>Tecnologias</th>
    <th>Propósito</th>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
      <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
      <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
      <img src="https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
    </td>
    <td>Interface responsiva, componentizada e de alta performance com server-side rendering e otimização automática.</td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Next.js_API-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js API" />
      <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    </td>
    <td>API Routes do Next.js para endpoints serverless com Node.js, eliminando a necessidade de um servidor separado.</td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>
      <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
      <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    </td>
    <td>Database relacional robusto com ORM moderno que fornece type-safety e migrations automatizadas.</td>
  </tr>
  <tr>
    <td><strong>Autenticação</strong></td>
    <td>
      <img src="https://img.shields.io/badge/NextAuth.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="NextAuth.js" />
      <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=json-web-tokens&logoColor=white" alt="JWT" />
    </td>
    <td>Sistema completo de autenticação com múltiplos provedores, sessões e proteção de rotas.</td>
  </tr>
  <tr>
    <td><strong>DevOps</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    </td>
    <td>Containerização para ambiente de desenvolvimento consistente e tipagem estática para código mais seguro.</td>
  </tr>
  <tr>
    <td><strong>Ferramentas</strong></td>
    <td>
      <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=react-hook-form&logoColor=white" alt="React Hook Form" />
      <img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=recharts&logoColor=white" alt="Recharts" />
      <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
    </td>
    <td>Bibliotecas especializadas para manipulação de formulários, visualização de dados e validação.</td>
  </tr>
</table>

### 🏗️ Arquitetura

A aplicação segue uma arquitetura moderna baseada no App Router do Next.js:

```
trader-evaluation/
├── app/                  # Rotas e páginas da aplicação
│   ├── (auth)/           # Sistema de autenticação
│   ├── (dashboard)/      # Painel administrativo
│   ├── api/              # API endpoints e webhooks
├── components/           # Componentes React reutilizáveis
├── lib/                  # Serviços e utilitários core
├── prisma/               # Schema e migrations do banco
├── public/               # Arquivos estáticos
├── utils/                # Funções utilitárias
├── hooks/                # Custom React hooks
```

Este projeto implementa:

- **Clean Architecture** - Separação clara de responsabilidades
- **DRY Principle** - Componentes reutilizáveis e abstrações
- **Type Safety** - TypeScript em todas as camadas da aplicação
- **Middleware Pattern** - Para autenticação e proteção de rotas

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js 18.x ou superior
- PostgreSQL 14.x ou superior
- Docker e Docker Compose (opcional)

### Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/trader-evaluation.git
cd trader-evaluation
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trader_evaluation"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="chave-secreta-para-nextauth"

# Email (para notificações)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="seu-usuario@example.com"
SMTP_PASS="sua-senha"
SMTP_SECURE="false"
EMAIL_FROM="email <noreply@example.com>"

# Integrações de Pagamento
HUBLA_WEBHOOK_SECRET="chave-secreta-hubla"
PAGARME_WEBHOOK_SECRET="chave-secreta-pagarme"
API_KEY="chave-api-para-integrações"


```

4. **Inicie o banco de dados com Docker (opcional)**

```bash
docker-compose up -d
```

5. **Execute as migrações do Prisma**

```bash
npx prisma migrate dev
```

6. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
# ou
yarn dev
```

7. **Crie um usuário administrador**

```bash
npm run create-admin
# ou
yarn create-admin
```

### Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- `clients` - Informações dos traders em avaliação
- `users` - Usuários administradores do sistema
- `contacts` - Registros de contato com clientes
- `payments` - Transações de pagamento recebidas
- `paid_accounts` - Contas remuneradas para traders aprovados

## 📱 Responsividade

A aplicação foi desenvolvida com design responsivo completo, funcionando perfeitamente em:

- 💻 Desktops
- 💻 Laptops
- 📱 Tablets
- 📱 Smartphones

## 🧪 Testes

A aplicação inclui testes automatizados para garantir qualidade e estabilidade:

```bash
# Executa os testes unitários
npm run test

# Executa os testes de integração
npm run test:integration

# Verifica a cobertura de testes
npm run test:coverage
```

## 👥 Autor

Desenvolvido por **Daniel Moura.**
