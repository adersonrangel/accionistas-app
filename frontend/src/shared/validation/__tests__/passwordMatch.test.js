import { describe, it, expect } from "vitest";
import { passwordMatch } from "../rules/passwordMatch.js";

describe("passwordMatch validator", () => {
  it("returns valid for undefined value", () => {
    const result = passwordMatch(undefined, { otherValue: "secret123" });
    expect(result.isValid).toBe(true);
  });

  it("returns valid for null value", () => {
    const result = passwordMatch(null, { otherValue: "secret123" });
    expect(result.isValid).toBe(true);
  });

  it("returns invalid when otherValue is missing", () => {
    const result = passwordMatch("secret123", {});
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Campo de contraseña no proporcionado para comparación");
  });

  it("returns invalid when otherValue is undefined", () => {
    const result = passwordMatch("secret123", { otherValue: undefined });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Campo de contraseña no proporcionado para comparación");
  });

  it("returns invalid when passwords do not match", () => {
    const result = passwordMatch("different", { otherValue: "secret123" });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Las contraseñas no coinciden");
  });

  it("returns valid when passwords match", () => {
    const result = passwordMatch("secret123", { otherValue: "secret123" });
    expect(result.isValid).toBe(true);
  });

  it("returns valid when both are empty strings", () => {
    const result = passwordMatch("", { otherValue: "" });
    expect(result.isValid).toBe(true);
  });
});