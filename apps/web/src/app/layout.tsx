import type { Metadata } from "next";

import { SyntheticEnvironmentBanner } from "@/components/layout/synthetic-environment-banner";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobIT",
  description: "Tu perfil tech, tus oportunidades y tus próximos pasos en un solo lugar."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Primero en el flujo: se lee antes que nada y empuja el contenido en
            lugar de superponerse. Devuelve null fuera de staging sintético. */}
        <SyntheticEnvironmentBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
