import { describe, it, expect } from "vitest";
import {
	getAdapter,
	getValidatorAdapter,
} from "../adapters/react-hook-form.js";
import "../index.js";

describe("react-hook-form adapter", () => {
	it("returns true for a valid value", () => {
		const adapter = getAdapter();
		const result = adapter.validate("hello", [{ type: "required" }]);
		expect(result).toBe(true);
	});

	it("returns an error string for an invalid value", () => {
		const adapter = getAdapter();
		const result = adapter.validate("", [{ type: "required" }]);
		expect(result).toBe("Este campo es obligatorio");
	});

	it("returns a default error message when validator provides none", () => {
		const adapter = getAdapter();
		const result = adapter.validate("x", [
			{ type: "minLength", params: { minimum: 5 }, message: "" },
		]);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("throws if an unknown library is requested", () => {
		expect(() => getValidatorAdapter("formik")).toThrow(
			"Adapter for formik not implemented",
		);
	});

	it("returns the adapter for react-hook-form", () => {
		const adapter = getValidatorAdapter("react-hook-form");
		expect(adapter).toHaveProperty("validate");
		expect(typeof adapter.validate).toBe("function");
	});
});
