import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Landing pública candidate-first", () => {
  it("muestra el título principal con la marca JobIT", () => {
    render(<Home />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/perfil tech/i);
    expect(h1).toHaveTextContent(/JobIT/i);
  });

  it("CTA 'Crear mi perfil' apunta a /register", () => {
    render(<Home />);
    const ctas = screen.getAllByRole("link", { name: /crear mi perfil/i });
    expect(ctas.length).toBeGreaterThan(0);
    ctas.forEach((cta) => expect(cta).toHaveAttribute("href", "/register"));
  });

  it("CTA 'Ver módulos' apunta al ancla #modulos", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /ver módulos/i })).toHaveAttribute("href", "#modulos");
  });

  it("ofrece 'Iniciar sesión' hacia /login y 'Crear cuenta' hacia /register", () => {
    render(<Home />);
    const login = screen.getAllByRole("link", { name: /iniciar sesión/i });
    expect(login.length).toBeGreaterThan(0);
    login.forEach((l) => expect(l).toHaveAttribute("href", "/login"));
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute("href", "/register");
  });

  it("presenta los cuatro módulos del MVP con el naming real del producto", () => {
    render(<Home />);
    // LAND-01 (21A): el hub se llama Dashboard también en la landing; "JobIT
    // Talent" era un nombre que no existía dentro del producto.
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Tu panel de candidato.")).toBeInTheDocument();
    expect(screen.queryByText("JobIT Talent")).not.toBeInTheDocument();
    expect(screen.getByText("JobIT CV")).toBeInTheDocument();
    expect(screen.getByText("JobIT Jobs")).toBeInTheDocument();
    expect(screen.getByText("JobIT Match")).toBeInTheDocument();
  });

  it("incluye las secciones principales", () => {
    render(<Home />);
    expect(screen.getByText("Los módulos del MVP")).toBeInTheDocument();
    expect(screen.getByText("Cómo funciona")).toBeInTheDocument();
    expect(screen.getByText("En el MVP y después")).toBeInTheDocument();
    expect(screen.getAllByText(/MVP candidate-first/i).length).toBeGreaterThan(0);
  });

  it("distingue lo disponible del MVP de lo futuro", () => {
    render(<Home />);
    expect(screen.getByText("Disponible en el MVP candidate-first")).toBeInTheDocument();
    expect(screen.getByText("No disponible en el MVP")).toBeInTheDocument();
    expect(screen.getByText("Preparado para después")).toBeInTheDocument();
  });

  it("no muestra pricing real, IA avanzada como producto ni copy del mock fuera de MVP", () => {
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
  });
});
