import { describe, expect, it, vi } from "vitest";

import { redirectOnMissingSession, redirectToLogin } from "./auth-navigation";

describe("auth-navigation (FLOW-02)", () => {
  it("redirectToLogin sin reason navega a /login", () => {
    const push = vi.fn();
    redirectToLogin({ push });
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("redirectToLogin('required') navega a /login?reason=required", () => {
    const push = vi.fn();
    redirectToLogin({ push }, "required");
    expect(push).toHaveBeenCalledWith("/login?reason=required");
  });

  it("redirectToLogin('expired') navega a /login?reason=expired", () => {
    const push = vi.fn();
    redirectToLogin({ push }, "expired");
    expect(push).toHaveBeenCalledWith("/login?reason=expired");
  });

  it("redirectOnMissingSession: endReason='logout' no redirige", () => {
    const push = vi.fn();
    redirectOnMissingSession({ push }, "logout");
    expect(push).not.toHaveBeenCalled();
  });

  it("redirectOnMissingSession: endReason='expired' → expired", () => {
    const push = vi.fn();
    redirectOnMissingSession({ push }, "expired");
    expect(push).toHaveBeenCalledWith("/login?reason=expired");
  });

  it("redirectOnMissingSession: endReason=null → required", () => {
    const push = vi.fn();
    redirectOnMissingSession({ push }, null);
    expect(push).toHaveBeenCalledWith("/login?reason=required");
  });
});
