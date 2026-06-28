import { describe, it, expect } from "vitest";
import { pattern } from "../rules/pattern.js";

describe("pattern validator", () => {
	const digitPattern = { pattern: "^\\d+$" }; // only digits

	it("returns valid for null", () => {
		const result = pattern(null, digitPattern);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for undefined", () => {
		const result = pattern(undefined, digitPattern);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for empty string", () => {
		const result = pattern("", digitPattern);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns invalid for non-digit string", () => {
		const result = pattern("abc", digitPattern);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Formato no válido");
	});

	it("returns valid for digit string", () => {
		const result = pattern("12345", digitPattern);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns invalid for mixed alphanumeric", () => {
		const result = pattern("12a34", digitPattern);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Formato no válido");
	});

	it("works with leading zeros", () => {
		const result = pattern("000123", digitPattern);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("flags option: case-insensitive letters only", () => {
		const letterPattern = { pattern: "^[a-z]+$", flags: "i" };
		expect(pattern("ABC", letterPattern).isValid).toBe(true);
		expect(pattern("AbC", letterPattern).isValid).toBe(true);
		expect(pattern("test123", letterPattern).isValid).toBe(false);
	});
});
