<div align="center">
  <h1>Trader Evaluation</h1>
  <p><strong>Complete management system for proprietary trading desks</strong></p>
  
  ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
  ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
</div>

![Dashboard Preview](https://via.placeholder.com/1200x630/0A2540/FFFFFF?text=Trader+Evaluation+Dashboard)

> **Developed with modern technologies, this CRM offers complete control over the lifecycle of traders under evaluation: from acquisition and monitoring to management of approved traders in funded accounts.**

## 📑 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Features and Functionality](#-features-and-functionality)
- [🛠️ Technology Stack](#️-technology-stack)
- [🔧 Configuration and Installation](#-configuration-and-installation)
- [📱 Responsiveness](#-responsiveness)
- [🌟 Roadmap and Future Features](#-roadmap-and-future-features)
- [🧪 Tests](#-tests)
- [📚 Documentation](#-documentation)
- [👥 Author](#-author)
- [📄 License](#-license)

## ✨ Overview

**Trader Evaluation** is a complete web application for companies that offer trader evaluations for proprietary trading desks. The system manages the entire lifecycle:

1. 💰 **Payment processing** - Integration with payment gateways
2. 📊 **Trader evaluation** - Performance tracking and metrics
3. 👨‍💼 **Funded account management** - For approved traders
4. 📈 **Analysis and re-engagement** - Strategies for rejected traders

### Workflow

```mermaid
graph TD
    A[Client Purchases Evaluation] -->|Payment Webhook| B(System Registration)
    B --> C{Evaluation}
    C -->|In progress| D[Monitoring]
    D --> E{Result}
    E -->|Approved| F[Funded Account]
    E -->|Rejected| G[Re-engagement]
    G -->|New attempt| A
```

The system offers a complete administration interface where managers can monitor traders' progress, manage accounts, view performance metrics, and automate communication processes.

## 🚀 Features and Functionality

<table>
  <tr>
    <td width="50%">
      <h3>📊 Interactive Dashboard</h3>
      <ul>
        <li>Consolidated view of key metrics</li>
        <li>Performance and trend charts</li>
        <li>Recent activity list</li>
        <li>Status indicators with alerts</li>
      </ul>
    </td>
    <td width="50%">
      <h3>👥 Client Management</h3>
      <ul>
        <li>Complete trader database</li>
        <li>Bulk import via CSV</li>
        <li>Advanced search and filtering</li>
        <li>Interaction history</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔄 Evaluation Flow</h3>
      <ul>
        <li>Automated start and end process</li>
        <li>Integration with trading platforms</li>
        <li>Timeline with deadline alerts</li>
        <li>Approval/rejection system</li>
      </ul>
    </td>
    <td width="50%">
      <h3>💸 Funded Accounts</h3>
      <ul>
        <li>Management of approved traders</li>
        <li>Control of plans and platforms</li>
        <li>Account activation and cancellation</li>
        <li>Performance monitoring</li>
      </ul>
    </td>
  </tr>
</table>

### Main Integrations

- **Payment Webhooks**: Hubla and Pagar.me
- **Automated Email**: Communication system via Nodemailer
- **RESTful API**: Endpoints for integrations with external systems

## 🛠️ Technology Stack

<table>
  <tr>
    <th>Category</th>
    <th>Technologies</th>
    <th>Purpose</th>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
      <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
      <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
      <img src="https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
    </td>
    <td>Responsive, componentized, and high-performance interface with server-side rendering and automatic optimization.</td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Next.js_API-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js API" />
      <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    </td>
    <td>Next.js API Routes for serverless endpoints with Node.js, eliminating the need for a separate server.</td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>
      <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
      <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    </td>
    <td>Robust relational database with a modern ORM that provides type-safety and automated migrations.</td>
  </tr>
  <tr>
    <td><strong>Authentication</strong></td>
    <td>
      <img src="https://img.shields.io/badge/NextAuth.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="NextAuth.js" />
      <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=json-web-tokens&logoColor=white" alt="JWT" />
    </td>
    <td>Complete authentication system with multiple providers, sessions, and route protection.</td>
  </tr>
  <tr>
    <td><strong>DevOps</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    </td>
    <td>Containerization for consistent development environment and static typing for safer code.</td>
  </tr>
  <tr>
    <td><strong>Tools</strong></td>
    <td>
      <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=react-hook-form&logoColor=white" alt="React Hook Form" />
      <img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=recharts&logoColor=white" alt="Recharts" />
      <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
    </td>
    <td>Specialized libraries for form handling, data visualization, and validation.</td>
  </tr>
</table>

### 🏗️ Architecture

The application follows a modern architecture based on Next.js App Router:

```
trader-evaluation/
├── app/                  # Application routes and pages
│   ├── (auth)/           # Authentication system
│   ├── (dashboard)/      # Administrative panel
│   ├── api/              # API endpoints and webhooks
├── components/           # Reusable React components
├── lib/                  # Core services and utilities
├── prisma/               # Database schema and migrations
├── public/               # Static files
├── utils/                # Utility functions
├── hooks/                # Custom React hooks
```

This project implements:

- **Clean Architecture** - Clear separation of responsibilities
- **DRY Principle** - Reusable components and abstractions
- **Type Safety** - TypeScript in all layers of the application
- **Middleware Pattern** - For authentication and route protection

## 🔧 Configuration and Installation

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Docker and Docker Compose (optional)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/trader-evaluation.git
cd trader-evaluation
```

2. **Install dependencies**

```bash
npm install
# or
yarn
```

3. **Configure environment variables**

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trader_evaluation"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="secret-key-for-nextauth"

# Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-user@example.com"
SMTP_PASS="your-password"
SMTP_SECURE="false"
EMAIL_FROM="email <noreply@example.com>"

# Payment Integrations
HUBLA_WEBHOOK_SECRET="hubla-secret-key"
PAGARME_WEBHOOK_SECRET="pagarme-secret-key"
API_KEY="api-key-for-integrations"
```

4. **Start the database with Docker (optional)**

```bash
docker-compose up -d
```

5. **Run Prisma migrations**

```bash
npx prisma migrate dev
```

6. **Start the development server**

```bash
npm run dev
# or
yarn dev
```

7. **Create an admin user**

```bash
npm run create-admin
# or
yarn create-admin
```

### Database Structure

The system uses the following main tables:

- `clients` - Information about traders under evaluation
- `users` - System administrator users
- `contacts` - Records of contact with clients
- `payments` - Payment transactions received
- `paid_accounts` - Funded accounts for approved traders

## 📱 Responsiveness

The application was developed with complete responsive design, working perfectly on:

- 💻 Desktops
- 💻 Laptops
- 📱 Tablets
- 📱 Smartphones

## 🧪 Tests

The application includes automated tests to ensure quality and stability:

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Check test coverage
npm run test:coverage
```

## 👥 Author

Developed by **Daniel Moura.**
