import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, ErrorState, LoadingState, Skeleton } from "./feedback";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

describe("LoadingState", () => {
  it("renderiza título/descripción con estado accesible (role=status, aria-busy)", () => {
    render(<LoadingState title="Cargando tu panel…" description="Un momento." />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Cargando tu panel…")).toBeInTheDocument();
    expect(screen.getByText("Un momento.")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("muestra el botón Reintentar y llama al handler cuando hay onRetry", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState title="No se ha podido cargar." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("no muestra botón si no hay onRetry", () => {
    render(<ErrorState title="Error" description="Detalle del error." />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Detalle del error.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renderiza el CTA como enlace cuando se pasan actionHref/actionLabel", () => {
    render(
      <EmptyState
        title="Aún no has guardado ninguna oferta."
        actionHref="/jobs"
        actionLabel="Buscar ofertas"
      />
    );
    expect(screen.getByRole("link", { name: "Buscar ofertas" })).toHaveAttribute("href", "/jobs");
  });

  it("no renderiza CTA sin actionHref y admite children como acción secundaria", () => {
    render(
      <EmptyState title="Sin resultados">
        <button type="button">Limpiar filtros</button>
      </EmptyState>
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar filtros" })).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("es decorativo (aria-hidden)", () => {
    const { container } = render(<Skeleton className="h-3 w-1/2" />);
    const el = container.firstElementChild;
    expect(el).toHaveAttribute("aria-hidden", "true");
  });
});
