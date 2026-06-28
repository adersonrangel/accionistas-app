import { describe, it, expect } from "vitest";
import { dateAfter } from "../rules/dateAfter.js";

describe("dateAfter validator", () => {
	it("returns valid for undefined value", () => {
		const result = dateAfter(undefined, { baseDate: "2024-01-01" });
		expect(result.isValid).toBe(true);
	});

	it("returns valid for null value", () => {
		const result = dateAfter(null, { baseDate: "2024-01-01" });
		expect(result.isValid).toBe(true);
	});

	it("returns invalid for invalid date string", () => {
		const result = dateAfter("not-a-date", { baseDate: "2024-01-01" });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Fecha no válida");
	});

	it("returns invalid when value is before baseDate", () => {
		const result = dateAfter("2023-12-31", { baseDate: "2024-01-01" });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("La fecha debe ser posterior a 2024-01-01");
	});

	it("returns invalid when value equals baseDate", () => {
		const result = dateAfter("2024-01-01", { baseDate: "2024-01-01" });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("La fecha debe ser posterior a 2024-01-01");
	});

	it("returns valid when value is after baseDate", () => {
		const result = dateAfter("2024-01-02", { baseDate: "2024-01-01" });
		expect(result.isValid).toBe(true);
	});

	it("returns valid when value is after baseDate using Date objects", () => {
		const result = dateAfter(new Date("2024-01-02"), {
			baseDate: new Date("2024-01-01"),
		});
		expect(result.isValid).toBe(true);
	});

	it("returns invalid when baseDate is invalid", () => {
		const result = dateAfter("2024-01-02", { baseDate: "invalid-date" });
		expect(result.isValid).toBe(false);
		expect(result.error).toBe("Fecha no válida");
	});
});
