import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home, { metadata } from "./page";

describe("Landing pública candidate-first", () => {
  it("muestra la propuesta de valor aprobada en un único H1", () => {
    render(<Home />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Tu perfil tech vivo para explorar oportunidades en JobIT"
    );
  });

  it("elimina la terminología de fase y diferencia capacidades de roadmap", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Capacidades actuales" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Disponible ahora y en el roadmap" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Líneas previstas de evolución" })).toBeInTheDocument();
    expect(screen.getByText("Estas capacidades no están disponibles actualmente y su alcance puede evolucionar.")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/\bMVP\b/i);
  });

  it("mantiene los cuatro módulos con naming real y disponibilidad actual", () => {
    render(<Home />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("JobIT CV")).toBeInTheDocument();
    expect(screen.getByText("JobIT Jobs")).toBeInTheDocument();
    expect(screen.getByText("JobIT Match")).toBeInTheDocument();
    expect(screen.getAllByText("Disponible ahora")).toHaveLength(5);
    expect(screen.getByText("Tecnología actual")).toBeInTheDocument();
  });

  it("mantiene coherencia entre navegación, destinos y headings", () => {
    render(<Home />);
    const destinations = [
      ["Producto", "#producto", "producto"],
      ["Capacidades", "#capacidades", "capacidades"],
      ["Cómo funciona", "#funcionamiento", "funcionamiento"],
      ["Roadmap", "#roadmap", "roadmap"]
    ] as const;
    destinations.forEach(([name, href, id]) => {
      screen.getAllByRole("link", { name }).forEach((link) => expect(link).toHaveAttribute("href", href));
      expect(document.getElementById(id)).not.toBeNull();
    });
    expect(screen.getByRole("link", { name: "Ver capacidades" })).toHaveAttribute("href", "#capacidades");
  });

  it("enlaza la marca a inicio y conserva el gradiente canónico", () => {
    const { container } = render(<Home />);
    const logos = screen.getAllByRole("link", { name: "JobIT" });
    expect(logos).toHaveLength(2);
    logos.forEach((logo) => expect(logo).toHaveAttribute("href", "/"));
    logos.forEach((logo) => {
      const mark = logo.querySelector('[aria-hidden="true"]');
      expect(mark).not.toBeNull();
      expect(mark).toHaveClass("from-jobit-brand");
      expect(mark).toHaveClass("to-jobit-green");
    });
    expect(container.querySelector('a[href="#producto"] [aria-hidden="true"]')).toBeNull();
  });

  it("mantiene CTAs y acceso con destinos correctos", () => {
    render(<Home />);
    screen.getAllByRole("link", { name: "Crear mi perfil" }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/register");
    });
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/register");
    screen.getAllByRole("link", { name: "Iniciar sesión" }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/login");
    });
    expect(screen.getByRole("link", { name: "Acceder" })).toHaveAttribute("href", "/login");
  });

  it("identifica la preview como figura con datos ficticios y sin dominio", () => {
    render(<Home />);
    expect(screen.getByRole("figure")).toBeInTheDocument();
    expect(screen.getByText("Ejemplo ilustrativo · datos ficticios", { selector: "figcaption" })).toBeVisible();
    expect(screen.getByText("Alex Ejemplo")).toBeInTheDocument();
    expect(screen.getAllByText(/Empresa Ejemplo/)).toHaveLength(2);
    expect(screen.getByText("Vista ilustrativa de JobIT")).toBeInTheDocument();
    expect(screen.getByText("Afinidad ilustrativa: 82/100")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/jobit\.app/i);
  });

  it("incluye un skip link hacia el único contenido principal", () => {
    render(<Home />);
    const skipLink = screen.getByRole("link", { name: "Saltar al contenido principal" });
    expect(skipLink).toHaveAttribute("href", "#contenido-principal");
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "contenido-principal");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("declara la solución móvil, foco visible y reduced motion sin reglas globales", () => {
    render(<Home />);
    expect(screen.getByRole("navigation", { name: "Secciones" })).toHaveClass("hidden", "md:flex");
    expect(screen.getByRole("link", { name: "Acceder" })).toHaveClass("md:hidden");
    expect(screen.getAllByRole("link", { name: "Iniciar sesión" })[0]).toHaveClass(
      "hidden",
      "md:inline-flex"
    );
    expect(screen.getAllByRole("link", { name: "Crear mi perfil" })[0]).toHaveClass(
      "focus-visible:ring-2",
      "motion-reduce:transform-none"
    );
  });

  it("no publica claims, pricing ni capacidades prohibidas", () => {
    render(<Home />);
    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/suscripci[oó]n/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\s?\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bAI\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/inteligencia artificial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/job matching ai/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ai tailoring/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/expertech/i)).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/IA avanzada/i);
    expect(document.body).not.toHaveTextContent(/contratación automática/i);
    expect(document.body).not.toHaveTextContent(/evaluamos candidatos/i);
    expect(document.body).not.toHaveTextContent(/garantizamos empleo/i);
    expect(document.body).not.toHaveTextContent(/mejor candidato/i);
    expect(document.body).not.toHaveTextContent(/precisión garantizada/i);
  });

  it("expone metadata específica sin URL ni assets inventados", () => {
    expect(metadata).toMatchObject({
      title: "JobIT | Perfil tech vivo y match explicable",
      description:
        "Construye tu perfil tech, reúne tu experiencia y proyectos, explora ofertas y entiende tu afinidad mediante reglas visibles.",
      openGraph: {
        type: "website",
        locale: "es_ES",
        title: "JobIT | Perfil tech vivo y match explicable",
        description:
          "Construye tu perfil tech, reúne tu experiencia y proyectos, explora ofertas y entiende tu afinidad mediante reglas visibles."
      },
      twitter: {
        card: "summary",
        title: "JobIT | Perfil tech vivo y match explicable",
        description:
          "Construye tu perfil tech, reúne tu experiencia y proyectos, explora ofertas y entiende tu afinidad mediante reglas visibles."
      }
    });
    expect(metadata).not.toHaveProperty("metadataBase");
    expect(metadata).not.toHaveProperty("alternates");
    expect(metadata).not.toHaveProperty("openGraph.url");
    expect(metadata).not.toHaveProperty("openGraph.images");
    expect(metadata).not.toHaveProperty("twitter.images");
  });
});
