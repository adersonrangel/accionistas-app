import { describe, it, expect } from "vitest";
import { range } from "../rules/range.js";

describe("range validator", () => {
	const bounds = { min: 0, max: 100 };

	it("returns invalid for null", () => {
		const result = range(null, bounds);
		expect(result.isValid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("returns invalid for undefined", () => {
		const result = range(undefined, bounds);
		expect(result.isValid).toBe(false);
	});

	it("returns invalid for empty string", () => {
		const result = range("", bounds);
		expect(result.isValid).toBe(false);
	});

	it("returns invalid for non-numeric string", () => {
		const result = range("abc", bounds);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Debe ser un número");
	});

	it("returns invalid when below min", () => {
		const result = range(-5, bounds);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Debe ser mayor o igual a 0");
	});

	it("returns invalid when above max", () => {
		const result = range(150, bounds);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Debe ser menor o igual a 100");
	});

	it("returns valid for boundary values", () => {
		expect(range(0, bounds).isValid).toBe(true);
		expect(range(100, bounds).isValid).toBe(true);
		expect(range("25.5", bounds).isValid).toBe(true);
	});
});
