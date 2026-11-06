// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccionistaDetalle from "../AccionistaDetalle";

const ACCIONISTA = {
	id: 1,
	nombre: "Juan",
	apellido: "Perez",
	dni: "30123456",
	email: "juan@ejemplo.com",
	porcentajeAcciones: "25",
	fechaIngreso: "2024-01-15",
	telefono: "555-1234",
	direccion: "Av. Siempre Viva 74",
};

const TOKEN = "test-token";

function setupLocalStorage(initial) {
	const store = { ...(initial || {}) };
	return {
		getItem: (k) => (k in store ? store[k] : null),
		setItem: (k, v) => { store[k] = String(v); },
		removeItem: (k) => { delete store[k]; },
		clear: () => { for (const k of Object.keys(store)) delete store[k]; },
	};
}

function mockFetch({ asignadas = [], disponibles = [] } = {}) {
	const post = vi.fn(async (url, opts = {}) => {
		if (opts.method === "POST" && url.includes("/acciones")) {
			return { ok: true, json: async () => ({ data: [], skipped: [] }) };
		}
		throw new Error("unexpected POST " + url);
	});
	const del = vi.fn(async (url) => {
		return { ok: true, json: async () => ({ message: "ok" }) };
	});
	const get = vi.fn(async (url) => {
		if (url.includes("/disponibles")) {
			return { ok: true, json: async () => ({ data: disponibles }) };
		}
		if (url.includes("/acciones")) {
			return { ok: true, json: async () => ({ data: asignadas }) };
		}
		throw new Error("unexpected GET " + url);
	});
	const fetchMock = vi.fn(async (url, opts = {}) => {
		const method = (opts.method || "GET").toUpperCase();
		if (method === "POST") return post(url, opts);
		if (method === "DELETE") return del(url);
		return get(url);
	});
	fetchMock.post = post;
	fetchMock.del = del;
	fetchMock.get = get;
	return fetchMock;
}

beforeEach(() => {
	vi.stubGlobal("localStorage", setupLocalStorage({ acciones_token: TOKEN }));
	vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("AccionistaDetalle - tab Acciones", () => {
	it("muestra los datos del accionista por defecto y el tab Acciones", async () => {
		vi.stubGlobal("fetch", mockFetch());
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		expect(
			await screen.findByText("Accionista: Juan Perez")
		).toBeTruthy();
		// Tab Datos visible por defecto
		expect(screen.getByText("juan@ejemplo.com")).toBeTruthy();

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		// Sin acciones asignadas
		expect(
			await screen.findByText(
				"Este accionista no tiene acciones asignadas."
			)
		).toBeTruthy();
	});

	it("muestra el detalle (codigo) de las acciones asignadas", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({ asignadas: [{ _id: "a1", code: "00001" }] })
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		// El codigo de la accion aparece en el detalle
		expect(await screen.findByText("00001")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "+ Asignar acciones" })
		).toBeTruthy();
	});

	it("asigna 1 o varias acciones seleccionadas (POST lote)", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({
				asignadas: [],
				disponibles: [
					{ _id: "a1", code: "00001" },
					{ _id: "a2", code: "00002" },
				],
			})
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));
		await user.click(
			await screen.findByRole("button", { name: "+ Asignar acciones" })
		);

		// Selecciona ambas acciones disponibles
		await user.click(await screen.findByTestId("accion-check-00001"));
		await user.click(screen.getByTestId("accion-check-00002"));
		await user.click(screen.getByRole("button", { name: /asignar seleccionadas/i }));

		const fetchMock = globalThis.fetch;
		const asignarCalls = fetchMock.mock.calls.filter(
			([url, opts]) =>
				opts?.method === "POST" &&
				url.includes("/accionistas/1/acciones")
		);
		expect(asignarCalls).toHaveLength(1);
		const body = JSON.parse(asignarCalls[0][1].body);
		expect(body.accionIds).toEqual(["a1", "a2"]);
		expect(
			asignarCalls[0][1].headers.Authorization
		).toBe(`Bearer ${TOKEN}`);
	});

	it("quita una accion asignada (DELETE) y muestra el mensaje", async () => {
		const f = mockFetch({ asignadas: [{ _id: "a1", code: "00001" }] });
		vi.stubGlobal("fetch", f);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));
		await user.click(await screen.findByRole("button", { name: "Quitar" }));

		await waitFor(() => {
			expect(
				screen.getByText("Acción 00001 quitada")
			).toBeTruthy();
		});
		expect(
			f.mock.calls.some(
				([url, opts]) => opts?.method === "DELETE" && url.includes("/a1")
			)
		).toBe(true);
	});

	it("sin token pide login antes de mostrar operaciones de escritura", async () => {
		localStorage.removeItem("acciones_token");
		vi.stubGlobal("fetch", mockFetch());
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		expect(await screen.findByText("Iniciar Sesión")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "+ Asignar acciones" })).toBeNull();
	});
});
