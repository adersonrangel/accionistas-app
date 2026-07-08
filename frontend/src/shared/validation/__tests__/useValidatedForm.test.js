// @vitest-environment jsdom
import "../index.js";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useValidatedForm } from "../useValidatedForm.js";
import { validate } from "../validator.js";

describe("useValidatedForm hook", () => {
	const fieldRules = {
		email: [
			{ type: "required" },
			{ type: "pattern", params: { pattern: "^[^@]+@[^@]+\\.[^@]+$" } },
		],
		age: [{ type: "required" }, { type: "minLength", params: { minimum: 2 } }],
	};

	it("validates email pattern directly", () => {
		const rules = [
			{ type: "pattern", params: { pattern: "^[^@]+@[^@]+\\.[^@]+$" } },
		];
		const result = validate("test@test.com", rules);
		expect(result.isValid).toBe(true);
	});

	it("initializes with provided initial values", () => {
		const { result } = renderHook(() =>
			useValidatedForm({ email: "test@test.com", age: "25" }, fieldRules),
		);
		expect(result.current.fieldValues).toEqual({
			email: "test@test.com",
			age: "25",
		});
		expect(result.current.fieldErrors.email).toBeUndefined();
		expect(result.current.fieldErrors.age).toBeUndefined();
	});

	it("validates on change and updates errors", () => {
		const { result } = renderHook(() =>
			useValidatedForm({ email: "", age: "" }, fieldRules),
		);

		// Initially no errors
		expect(result.current.fieldErrors.email).toBeUndefined();
		expect(result.current.fieldErrors.age).toBeUndefined();

		// Change email to invalid
		act(() => {
			result.current
				.getFieldProps("email")
				.onChange({ target: { value: "invalid" } });
		});
		expect(result.current.fieldErrors.email).toBeTruthy();
		expect(result.current.fieldErrors.email).toContain("Formato no válido");

		// Change email to valid
		act(() => {
			result.current
				.getFieldProps("email")
				.onChange({ target: { value: "valid@test.com" } });
		});
		expect(result.current.fieldErrors.email).toBe("");
	});

	it("validates on blur", () => {
		const { result } = renderHook(() =>
			useValidatedForm({ email: "", age: "" }, fieldRules),
		);

		act(() => {
			result.current
				.getFieldProps("email")
				.onBlur({ target: { value: "invalid" } });
		});
		expect(result.current.fieldErrors.email).toBeTruthy();
	});

	it("reset clears values and errors", () => {
		const { result } = renderHook(() =>
			useValidatedForm({ email: "test@test.com", age: "25" }, fieldRules),
		);

		act(() => {
			result.current
				.getFieldProps("email")
				.onChange({ target: { value: "invalid" } });
		});
		expect(result.current.fieldErrors.email).toBeTruthy();

		act(() => {
			result.current.reset();
		});
		expect(result.current.fieldValues).toEqual({
			email: "test@test.com",
			age: "25",
		});
		expect(result.current.fieldErrors.email).toBeUndefined();
	});

	it("reset accepts values to populate the form", () => {
		const { result } = renderHook(() =>
			useValidatedForm({ email: "", age: "" }, fieldRules),
		);

		act(() => {
			result.current.reset({
				email: "juan@example.com",
				age: "30",
			});
		});

		expect(result.current.fieldValues).toEqual({
			email: "juan@example.com",
			age: "30",
		});
		expect(result.current.fieldErrors).toEqual({});
	});

	it("handleSubmit calls onValid when all fields valid", () => {
		const onValid = vi.fn();
		const { result } = renderHook(() =>
			useValidatedForm({ email: "test@test.com", age: "25" }, fieldRules),
		);

		act(() => {
			result.current.handleSubmit(onValid)({ preventDefault: vi.fn() });
		});
		expect(onValid).toHaveBeenCalledWith({ email: "test@test.com", age: "25" });
	});

	it("handleSubmit does not call onValid when fields invalid", () => {
		const onValid = vi.fn();
		const { result } = renderHook(() =>
			useValidatedForm({ email: "invalid", age: "" }, fieldRules),
		);

		act(() => {
			result.current.handleSubmit(onValid)({ preventDefault: vi.fn() });
		});
		expect(onValid).not.toHaveBeenCalled();
		expect(result.current.fieldErrors.email).toBeTruthy();
		expect(result.current.fieldErrors.age).toBeTruthy();
	});
});
