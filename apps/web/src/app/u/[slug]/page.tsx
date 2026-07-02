import type { Metadata } from "next";

import { PublicPortfolioPage } from "@/features/profile/public-portfolio-page";

// Privacidad V1: no indexar la ruta pública del portfolio (los no publicados
// devuelven 404). Se puede revisar la política de indexación en un sprint futuro.
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function PublicPortfolioRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicPortfolioPage slug={slug} />;
}
