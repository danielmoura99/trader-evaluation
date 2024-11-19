/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    maxDuration: 60, // Define o limite máximo de 60 segundos (limite do plano hobby)
  },
  // Configuração para funções serverless
  functions: {
    "api/**/*.ts": {
      maxDuration: 60,
    },
  },
};

export default nextConfig;
