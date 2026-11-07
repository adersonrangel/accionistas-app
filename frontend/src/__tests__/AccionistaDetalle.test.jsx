// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
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
const ADMIN_USER = JSON.stringify({ username: "admin", role: "admin" });

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
	vi.stubGlobal("localStorage", setupLocalStorage({ app_token: TOKEN, app_user: ADMIN_USER }));
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

	it("muestra el porcentaje en el listado de acciones asignadas", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({ asignadas: [{ _id: "a1", code: "00001", percentage: 25 }] })
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		expect(screen.getByText("Porcentaje")).toBeTruthy();
		expect(await screen.findByText("25 %")).toBeTruthy();
	});

	it("muestra el porcentaje en el popup de asignación", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({
				asignadas: [],
				disponibles: [{ _id: "a1", code: "00001", percentage: 40 }],
			})
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));
		await user.click(
			await screen.findByRole("button", { name: "+ Asignar acciones" })
		);

		expect(await screen.findByText("40 %")).toBeTruthy();
	});

	it("muestra las noches de beneficio en el listado de acciones asignada", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({
				asignadas: [
					{ _id: "a1", code: "00001", percentage: 25, nochesDeBeneficio: 3 },
				],
			})
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		const tabla = await screen.findByRole("table");
		expect(within(tabla).getByText("Noches de beneficio")).toBeTruthy();
		expect(await within(tabla).findByText("3")).toBeTruthy();
	});

	it("muestra las noches de beneficio en el popup de asignación", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({
				asignadas: [],
				disponibles: [
					{ _id: "a1", code: "00001", percentage: 40, nochesDeBeneficio: 4 },
				],
			})
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));
		await user.click(
			await screen.findByRole("button", { name: "+ Asignar acciones" })
		);

		const popup = await screen.findByRole("dialog");
		expect(await within(popup).findByText("Noches de beneficio")).toBeTruthy();
		expect(within(popup).getByText("4")).toBeTruthy();
	});

	it("card con total de noches de beneficio sumando las acciones asignadas", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({
				asignadas: [
					{ _id: "a1", code: "00001", percentage: 25, nochesDeBeneficio: 2 },
					{ _id: "a2", code: "00002", percentage: 10, nochesDeBeneficio: 3 },
				],
			})
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		expect(
			await screen.findByRole("heading", { name: "Total de Noches de Beneficio" })
		).toBeTruthy();
		const total = await screen.findByTestId("total-noches-beneficio");
		expect(total.textContent.trim()).toBe("5");
	});

	it("muestra guion y total cero cuando faltan las noches de beneficio", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({ asignadas: [{ _id: "a1", code: "00001", percentage: 25 }] })
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		const tabla = await screen.findByRole("table");
		expect(within(tabla).getByText("Noches de beneficio")).toBeTruthy();
		expect(within(tabla).getByText("—")).toBeTruthy();
		const total = await screen.findByTestId("total-noches-beneficio");
		expect(total.textContent.trim()).toBe("0");
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

	it("quita una accion asignada con confirmacion en popup (DELETE) y muestra el mensaje", async () => {
		const f = mockFetch({ asignadas: [{ _id: "a1", code: "00001" }] });
		vi.stubGlobal("fetch", f);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));
		await user.click(await screen.findByRole("button", { name: "Quitar" }));

		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeTruthy();
		expect(screen.getByText("¿Quitar la acción 00001?")).toBeTruthy();
		expect(
			f.mock.calls.some(
				([url, opts]) => opts?.method === "DELETE" && url.includes("/a1")
			)
		).toBe(false);

		await user.click(within(dialog).getByRole("button", { name: /quitar/i }));

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

	it("no quita la accion al pulsar Cancelar en el popup", async () => {
		const f = mockFetch({ asignadas: [{ _id: "a1", code: "00001" }] });
		vi.stubGlobal("fetch", f);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Acciones" }));
		await user.click(await screen.findByRole("button", { name: "Quitar" }));

		await user.click(screen.getByRole("button", { name: /cancelar/i }));

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(
			f.mock.calls.some(
				([url, opts]) => opts?.method === "DELETE" && url.includes("/a1")
			)
		).toBe(false);
	});

	it("sin sesión no muestra el tab Acciones (solo admin)", async () => {
		vi.stubGlobal("localStorage", setupLocalStorage({}));
		vi.stubGlobal("fetch", mockFetch());
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		expect(
			await screen.findByText("Accionista: Juan Perez")
		).toBeTruthy();
		// Sin sesión no hay acceso a operaciones de escritura
		expect(screen.queryByRole("button", { name: "Acciones" })).toBeNull();
		expect(
			screen.queryByRole("button", { name: "+ Asignar acciones" })
		).toBeNull();
	});

	it("con sesión de usuario normal muestra el tab Acciones en solo lectura", async () => {
		vi.stubGlobal(
			"localStorage",
			setupLocalStorage({
				app_token: TOKEN,
				app_user: JSON.stringify({ username: "normal", role: "user" }),
			})
		);
		vi.stubGlobal(
			"fetch",
			mockFetch({ asignadas: [{ _id: "a1", code: "00001", percentage: 25 }] })
		);
		render(<AccionistaDetalle accionista={ACCIONISTA} onBack={() => {}} />);

		const user = userEvent.setup();
		// El usuario normal SÍ ve el tab Acciones...
		await user.click(screen.getByRole("button", { name: "Acciones" }));

		// ...y ve las acciones asignadas.
		expect(await screen.findByText("00001")).toBeTruthy();

		// ...pero sin controles de escritura.
		expect(
			screen.queryByRole("button", { name: "+ Asignar acciones" })
		).toBeNull();
		expect(screen.queryByRole("button", { name: "Quitar" })).toBeNull();
	});
});
