import { describe, it, expect } from "vitest";
import { maxLength } from "../rules/maxLength.js";

describe("maxLength validator", () => {
	it("returns valid for null", () => {
		const result = maxLength(null, { maximum: 5 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for undefined", () => {
		const result = maxLength(undefined, { maximum: 5 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for empty string", () => {
		const result = maxLength("", { maximum: 5 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for string within limit", () => {
		const result = maxLength("hello", { maximum: 5 });
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns invalid for string exceeding limit", () => {
		const result = maxLength("helloworld", { maximum: 5 });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("No debe exceder los 5 caracteres");
	});

	it("returns invalid for string exactly limit+1", () => {
		const result = maxLength("abcdef", { maximum: 5 });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("No debe exceder los 5 caracteres");
	});

	it("works with numeric input (converted to string)", () => {
		const result = maxLength(12345, { maximum: 5 }); // "12345" length 5
		expect(result.isValid).toBe(true);
	});

	it("works with numeric input exceeding limit", () => {
		const result = maxLength(123456, { maximum: 5 }); // "123456" length 6
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("No debe exceder los 5 caracteres");
	});

	it("zero maximum allows only empty/null/undefined", () => {
		expect(maxLength("", { maximum: 0 }).isValid).toBe(true);
		expect(maxLength(null, { maximum: 0 }).isValid).toBe(true);
		expect(maxLength(undefined, { maximum: 0 }).isValid).toBe(true);
		expect(maxLength("a", { maximum: 0 }).isValid).toBe(false);
	});
});
