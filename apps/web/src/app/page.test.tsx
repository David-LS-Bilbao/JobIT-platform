import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Landing candidate-first", () => {
  it("muestra la marca JobIT", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /JobIT/i })).toBeInTheDocument();
  });

  it("ofrece accesos a login, registro y dashboard", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
  });
});
