import { describe, it, expect } from "vitest";
import { required } from "../rules/required.js";

describe("required validator", () => {
	it("returns invalid for null", () => {
		const result = required(null);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Este campo es obligatorio");
	});

	it("returns invalid for undefined", () => {
		const result = required(undefined);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Este campo es obligatorio");
	});

	it("returns invalid for empty string", () => {
		const result = required("");
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Este campo es obligatorio");
	});

	it("returns invalid for whitespace-only string", () => {
		const result = required("   ");
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Este campo es obligatorio");
	});

	it("returns valid for non-empty string", () => {
		const result = required("hello");
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for number zero", () => {
		const result = required(0);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for false boolean", () => {
		const result = required(false);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for empty array", () => {
		const result = required([]);
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns valid for empty object", () => {
		const result = required({});
		expect(result.isValid).toBe(true);
		expect(result.error).toBeUndefined();
	});
});
