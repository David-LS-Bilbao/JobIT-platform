import { describe, expect, it } from "vitest";

import {
  validateEmailRequired,
  validateLoginForm,
  validatePasswordPolicy,
  validateRegisterForm
} from "./auth-validation";

describe("auth-validation", () => {
  it("validateEmailRequired exige un email con formato válido", () => {
    expect(validateEmailRequired("")).toBeDefined();
    expect(validateEmailRequired("nope")).toBeDefined();
    expect(validateEmailRequired("c@jobit.dev")).toBeUndefined();
  });

  it("validatePasswordPolicy aplica longitud, mayúscula y número", () => {
    expect(validatePasswordPolicy("short")).toBeDefined();
    expect(validatePasswordPolicy("lowercase1")).toBeDefined();
    expect(validatePasswordPolicy("NoNumbers")).toBeDefined();
    expect(validatePasswordPolicy("Valid123")).toBeUndefined();
  });

  it("validateLoginForm marca email y password vacíos", () => {
    const errors = validateLoginForm({ email: "", password: "" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it("validateRegisterForm detecta confirmación distinta", () => {
    const mismatch = validateRegisterForm({
      email: "c@jobit.dev",
      password: "Valid123",
      confirmPassword: "Other123"
    });
    expect(mismatch.confirmPassword).toBeDefined();

    const ok = validateRegisterForm({
      email: "c@jobit.dev",
      password: "Valid123",
      confirmPassword: "Valid123"
    });
    expect(ok.confirmPassword).toBeUndefined();
  });
});
