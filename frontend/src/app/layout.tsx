import { ShellClient } from "@/components/shell-client";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "x1biu — Batalha de Assobios",
  description: "App de batalha 1v1 de assobios com ranking global",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jetbrainsMono.variable}>
      <body>
        <ShellClient>{children}</ShellClient>
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
