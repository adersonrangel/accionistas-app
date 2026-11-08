// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultaAccionista from "../ConsultaAccionista";

const ACCIONISTA = {
	id: 1,
	nombre: "Juan",
	apellido: "Perez",
	dni: "12313231-6",
	email: "juan@ejemplo.com",
	telefono: "555-1234",
	direccion: "Av. Siempre Viva 74",
	fechaIngreso: "2024-01-15",
	porcentajeAcciones: 25,
	noches: { totales: 10, usadas: 2, disponibles: 8 },
	acciones: [],
};

function respuesta(data) {
	return { ok: true, json: async () => ({ data }) };
}

function fechaHoyLocal() {
	const ahora = new Date();
	return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 10);
}

describe("ConsultaAccionista - descuento de noches", () => {
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("abre el popup con la fecha de hoy, descuenta en la fecha seleccionada y actualiza la card", async () => {
		const user = userEvent.setup();
		const actualizado = {
			...ACCIONISTA,
			noches: { totales: 10, usadas: 4, disponibles: 6 },
		};
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(respuesta(ACCIONISTA))
			.mockResolvedValueOnce(respuesta(actualizado));
		vi.stubGlobal("fetch", fetchMock);
		render(<ConsultaAccionista />);

		await user.type(screen.getByLabelText("Buscar por identificación"), ACCIONISTA.dni);
		await user.click(screen.getByRole("button", { name: "Buscar" }));
		expect(await screen.findByText("Juan Perez")).toBeTruthy();

		await user.click(screen.getByRole("button", { name: /descontar noches/i }));
		const dialog = await screen.findByRole("dialog", { name: "Descontar noches" });
		const fecha = within(dialog).getByLabelText("Fecha de descuento");
		expect(fecha.value).toBe(fechaHoyLocal());

		fireEvent.change(fecha, { target: { value: "2026-03-15" } });
		const cantidad = within(dialog).getByLabelText("Cantidad de noches");
		await user.clear(cantidad);
		await user.type(cantidad, "2");
		await user.click(within(dialog).getByRole("button", { name: /confirmar descuento/i }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		const [url, opciones] = fetchMock.mock.calls[1];
		expect(url).toBe("http://localhost:3001/api/consulta/accionista/dni/12313231-6/descuento");
		expect(opciones.method).toBe("POST");
		expect(JSON.parse(opciones.body)).toEqual({ cantidad: 2, fecha: "2026-03-15" });
		expect(await screen.findByRole("progressbar", { name: "6 de 10 noches disponibles" })).toBeTruthy();
		expect(screen.queryByRole("dialog", { name: "Descontar noches" })).toBeNull();
	});

	it("muestra la fecha y las noches del historial, incluidos años anteriores", async () => {
		const user = userEvent.setup();
		const historial = [
			{
				id: "mov-2",
				tipo: "devolucion",
				cantidad: 1,
				fecha: "2026-01-15T00:00:00.000Z",
				motivo: "Cancelación",
				usuario: "admin",
			},
			{
				id: "mov-1",
				tipo: "descuento",
				cantidad: 2,
				fecha: "2025-12-20T00:00:00.000Z",
				motivo: "Fin de semana",
				usuario: "normal",
			},
		];
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(respuesta(ACCIONISTA))
			.mockResolvedValueOnce(respuesta(historial));
		vi.stubGlobal("fetch", fetchMock);
		render(<ConsultaAccionista />);

		await user.type(screen.getByLabelText("Buscar por identificación"), ACCIONISTA.dni);
		await user.click(screen.getByRole("button", { name: "Buscar" }));
		expect(await screen.findByText("Juan Perez")).toBeTruthy();
		await user.click(screen.getByRole("button", { name: /ver historial/i }));

		const dialog = await screen.findByRole("dialog", { name: "Historial de noches" });
		const devolucion = (await within(dialog).findByText("15/01/2026")).closest("tr");
		expect(within(devolucion).getByText("Devolución")).toBeTruthy();
		expect(within(devolucion).getByText("1")).toBeTruthy();
		const descuento = within(dialog).getByText("20/12/2025").closest("tr");
		expect(within(descuento).getByText("Descuento")).toBeTruthy();
		expect(within(descuento).getByText("2")).toBeTruthy();
		expect(fetchMock.mock.calls[1][0]).toBe(
			"http://localhost:3001/api/consulta/accionista/dni/12313231-6/historial"
		);
	});
});
