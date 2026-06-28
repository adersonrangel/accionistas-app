// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValidationDemo from "../components/ValidationDemo.jsx";

describe("ValidationDemo integration tests", () => {
	let user;

	beforeEach(() => {
		user = userEvent.setup();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it("shows error when required field is empty on submit", async () => {
		render(<ValidationDemo />);
		const submitButton = screen.getByRole("button", { name: /enviar/i });
		await user.click(submitButton);

		expect(
			screen.queryByText(/la fecha de inicio es obligatoria/i),
		).not.toBeNull();
		expect(
			screen.queryByText(/la fecha de fin es obligatoria/i),
		).not.toBeNull();
		expect(screen.queryByText(/la contraseña es obligatoria/i)).not.toBeNull();
		expect(screen.queryByText(/confirme la contraseña/i)).not.toBeNull();
	});

	it("shows format error for invalid date pattern", async () => {
		render(<ValidationDemo />);
		const startDateInput = screen.getByLabelText(/fecha de inicio \*/i);
		await user.type(startDateInput, "invalid-date");
		const submitButton = screen.getByRole("button", { name: /enviar/i });
		await user.click(submitButton);

		expect(screen.queryByText(/formato de fecha inv/i)).not.toBeNull();
	});

	it("shows multiple errors when multiple fields are invalid", async () => {
		render(<ValidationDemo />);
		const startDateInput = screen.getByLabelText(/fecha de inicio \*/i);
		await user.type(startDateInput, "2024-01-01");
		const submitButton = screen.getByRole("button", { name: /enviar/i });
		await user.click(submitButton);

		expect(
			screen.queryByText(/la fecha de fin es obligatoria/i),
		).not.toBeNull();
		expect(screen.queryByText(/la contraseña es obligatoria/i)).not.toBeNull();
		expect(screen.queryByText(/confirme la contraseña/i)).not.toBeNull();
	});

	it("submits successfully when all fields are valid", async () => {
		vi.spyOn(window, "alert").mockImplementation(() => {});

		render(<ValidationDemo />);

		await user.type(screen.getByLabelText(/fecha de inicio \*/i), "2024-01-01");
		await user.type(screen.getByLabelText(/fecha de fin \*/i), "2024-01-02");
		await user.type(screen.getByLabelText(/^contraseña \*$/i), "password123");
		await user.type(
			screen.getByLabelText(/confirmar contraseña \*/i),
			"static-password-123",
		);

		const submitButton = screen.getByRole("button", { name: /enviar/i });
		await user.click(submitButton);

		expect(screen.queryByText(/obligatoria/i)).toBeNull();
		expect(screen.queryByText(/inválido/i)).toBeNull();
		expect(screen.queryByText(/coinciden/i)).toBeNull();

		expect(window.alert).toHaveBeenCalledWith(
			"Form submitted successfully! Check console.",
		);
	});

	it("shows cross-field validation error for dateAfter", async () => {
		render(<ValidationDemo />);
		await user.type(screen.getByLabelText(/fecha de inicio \*/i), "2024-01-10");
		await user.type(screen.getByLabelText(/fecha de fin \*/i), "2023-12-31");

		const submitButton = screen.getByRole("button", { name: /enviar/i });
		await user.click(submitButton);

		expect(
			screen.queryByText(/posterior a la fecha de inicio/i),
		).not.toBeNull();
	});

	it("shows cross-field validation error for passwordMatch", async () => {
		render(<ValidationDemo />);
		await user.type(screen.getByLabelText(/^contraseña \*$/i), "password123");
		await user.type(
			screen.getByLabelText(/confirmar contraseña \*/i),
			"wrong-password",
		);
		const submitButton = screen.getByRole("button", { name: /enviar/i });
		await user.click(submitButton);

		expect(screen.queryByText(/las contraseñas no coinciden/i)).not.toBeNull();
	});
});
