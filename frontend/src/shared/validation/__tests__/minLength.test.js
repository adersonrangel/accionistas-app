import { describe, it, expect } from "vitest";
import { minLength } from "../rules/minLength.js";

describe("minLength validator", () => {
	it("returns valid for null", () => {
		const result = minLength(null, { minimum: 3 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for undefined", () => {
		const result = minLength(undefined, { minimum: 3 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns invalid for empty string", () => {
		const result = minLength("", { minimum: 3 });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Debe tener al menos 3 caracteres");
	});

	it("returns valid for whitespace-only string when length >= minimum", () => {
		const result = minLength("   ", { minimum: 3 }); // length 3
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns invalid for whitespace-only string when length < minimum", () => {
		const result = minLength("  ", { minimum: 3 }); // length 2
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Debe tener al menos 3 caracteres");
	});

	it("returns invalid for string shorter than minimum", () => {
		const result = minLength("ab", { minimum: 3 });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Debe tener al menos 3 caracteres");
	});

	it("returns valid for string equal to minimum length", () => {
		const result = minLength("abc", { minimum: 3 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for string longer than minimum", () => {
		const result = minLength("abcd", { minimum: 3 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("works with numeric input (converted to string)", () => {
		const result = minLength(12, { minimum: 2 }); // "12" length 2
		expect(result.isValid).toBe(true);
	});

	it("returns invalid for numeric input too short", () => {
		const result = minLength(1, { minimum: 2 }); // "1" length 1
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Debe tener al menos 2 caracteres");
	});
});
