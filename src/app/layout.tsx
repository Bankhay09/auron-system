import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuronThemeProvider } from "@/components/AuronThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.auronsystem.com"),
  title: {
    default: "Auron System",
    template: "%s | Auron System"
  },
  description: "Plataforma premium de disciplina, diario estoico, habitos, metricas e IA.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://www.auronsystem.com"
  },
  openGraph: {
    title: "Auron System",
    description: "Disciplina, diario estoico, habitos, metricas e IA.",
    url: "https://www.auronsystem.com",
    siteName: "Auron System",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><AuronThemeProvider>{children}</AuronThemeProvider></body>
    </html>
  );
}
