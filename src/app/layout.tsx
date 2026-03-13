import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import IOSInstallPrompt from "@/components/IOSInstallPrompt";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TBrain - Central de Inteligência Pessoal",
  description: "Assistente pessoal inteligente: finanças, metas, cofre neural e controle por voz.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TBrain",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 overflow-hidden`}>
        <ThemeProvider>
          <div className="flex flex-col h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
              <main className="flex-1 overflow-y-auto pt-6 scroll-smooth">
                 {children}
              </main>
              <IOSInstallPrompt />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
