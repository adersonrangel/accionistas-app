import { describe, it, expect, vi } from "vitest";
import {
	validate,
	registerValidator,
	getValidatorAdapter,
} from "../validator.js";

describe("validator core", () => {
	it("throws for unknown validation type", () => {
		const result = validate("test", [{ type: "unknown" }]);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("Unknown validation type");
	});

	it("returns valid for empty rules", () => {
		const result = validate("test", []);
		expect(result.isValid).toBe(true);
	});

	it("registerValidator adds to RULES", () => {
		const custom = vi.fn().mockReturnValue({ isValid: true });
		registerValidator("custom", custom);
		const result = validate("test", [{ type: "custom" }]);
		expect(custom).toHaveBeenCalledWith("test", {});
		expect(result.isValid).toBe(true);
	});

	it("getValidatorAdapter throws when not implemented", () => {
		expect(() => getValidatorAdapter("nonexistent")).toThrow(
			"Adapter for nonexistent not implemented",
		);
	});
});
