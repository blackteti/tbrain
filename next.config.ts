import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Pré-cache defense para evitar Eviction da Apple (Apple apaga PWA em 7 dias sem uso)
  // Workbox vai cachear o App Shell principal sempre que abrir
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "jarvis-offline-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Turbopack desabilitado temporariamente no build via script `server.js` (Express Custom Server). 
  // Custom Servers no Next não tem suporte total garantido ao Turbopack em todas as versões.
  reactStrictMode: true,
};

export default withPWA(nextConfig);
