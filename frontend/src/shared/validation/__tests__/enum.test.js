import { describe, it, expect } from "vitest";
import { enumValidator } from "../rules/enum.js";

describe("enum validator", () => {
  const allowed = { allowed: ["admin", "user", "guest"] };

  it("returns valid for null", () => {
    const result = enumValidator(null, allowed);
    expect(result.isValid).toBe(true);
  });

  it("returns valid for undefined", () => {
    const result = enumValidator(undefined, allowed);
    expect(result.isValid).toBe(true);
  });

  it("returns invalid for empty string", () => {
    const result = enumValidator("", allowed);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Valor no permitido. Valores permitidos: admin, user, guest");
  });

  it("returns valid for allowed value", () => {
    expect(enumValidator("admin", allowed).isValid).toBe(true);
    expect(enumValidator("user", allowed).isValid).toBe(true);
    expect(enumValidator("guest", allowed).isValid).toBe(true);
  });

  it("returns invalid for non-allowed value", () => {
    expect(enumValidator("admin2", allowed).isValid).toBe(false);
    expect(enumValidator("supervisor", allowed).isValid).toBe(false);
    expect(enumValidator("", allowed).isValid).toBe(false);
  });

  it("works with numeric allowed values", () => {
    const numAllowed = { allowed: [1, 2, 3] };
    expect(enumValidator(1, numAllowed).isValid).toBe(true);
    expect(enumValidator(2, numAllowed).isValid).toBe(true);
    expect(enumValidator(3, numAllowed).isValid).toBe(true);
    expect(enumValidator(0, numAllowed).isValid).toBe(false);
    expect(enumValidator("1", numAllowed).isValid).toBe(false); // strict equality
  });

  it("case sensitivity", () => {
    expect(enumValidator("Admin", allowed).isValid).toBe(false);
  });
});
