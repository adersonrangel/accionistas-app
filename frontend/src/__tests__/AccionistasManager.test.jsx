// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccionistasManager from "../AccionistasManager";

const API_URL = "http://localhost:3001/api/accionistas";

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

function mockApi(accionistas) {
	return vi.fn(async (url, opts = {}) => {
		const method = (opts.method || "GET").toUpperCase();
		if (method === "GET") {
			return { ok: true, json: async () => ({ data: accionistas }) };
		}
		if (method === "POST" || method === "PUT") {
			return { ok: true, json: async () => ({ data: accionistas }) };
		}
		return { ok: true, json: async () => ({}) };
	});
}

// El administrador es quien ve los controles de escritura (incl. Eliminar).
function stubSessionAsAdmin() {
	vi.stubGlobal(
		"localStorage",
		{
			getItem: (k) =>
				k === "app_token"
					? "admin-token"
					: k === "app_user"
						? JSON.stringify({ username: "admin", role: "admin" })
						: null,
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
		}
	);
}

describe("AccionistasManager con popup de alta/edición", () => {
	let user;

	beforeEach(() => {
		user = userEvent.setup();
		stubSessionAsAdmin();
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("muestra la lista de accionistas sin mostrar el formulario por defecto", async () => {
		vi.stubGlobal("fetch", mockApi([ACCIONISTA]));
		render(<AccionistasManager />);

		expect(await screen.findByText("Juan")).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: /crear accionista/i })
		).toBeNull();
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("abre un popup con formulario vacío al pulsar Agregar Accionista y envía POST al crear", async () => {
		const fetchMock = mockApi([]);
		vi.stubGlobal("fetch", fetchMock);
		render(<AccionistasManager />);

		await user.click(
			screen.getByRole("button", { name: /agregar accionista/i })
		);
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /nuevo accionista/i })
		).toBeTruthy();
		expect(screen.getByLabelText("Nombre").value).toBe("");

		// El porcentaje no es editable: se deriva de las acciones asignadas.
		expect(screen.getByLabelText("% Acciones").disabled).toBe(true);
		expect(screen.getByLabelText("% Acciones").value).toBe("0");

		await user.type(screen.getByLabelText("Nombre"), "Ana");
		await user.type(screen.getByLabelText("Apellido"), "Gomez");
		await user.type(screen.getByLabelText("DNI"), "12345678");
		await user.type(screen.getByLabelText("Email"), "ana@ejemplo.com");
		fireEvent.change(screen.getByLabelText("Fecha de Ingreso"), {
			target: { value: "2024-02-01" },
		});
		await user.click(
			screen.getByRole("button", { name: /crear accionista/i })
		);

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				API_URL,
				expect.objectContaining({ method: "POST" })
			)
		);
		const postCall = fetchMock.mock.calls.find(
			([, opts]) => opts?.method === "POST"
		);
		const body = JSON.parse(postCall[1].body);
		expect(body.nombre).toBe("Ana");
		expect(body.apellido).toBe("Gomez");
		expect(body.email).toBe("ana@ejemplo.com");
		expect(body).not.toHaveProperty("porcentajeAcciones");
		expect(body).not.toHaveProperty("id");

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(
			screen.getByText("Accionista creado correctamente")
		).toBeTruthy();
	});

	it("abre un popup con los datos precargados al pulsar Editar y envía PUT con la actualización", async () => {
		const fetchMock = mockApi([ACCIONISTA]);
		vi.stubGlobal("fetch", fetchMock);
		render(<AccionistasManager />);
		await screen.findByText("Juan");

		await user.click(screen.getByRole("button", { name: /editar/i }));
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /editar accionista/i })
		).toBeTruthy();
		expect(screen.getByLabelText("Nombre").value).toBe("Juan");
		expect(screen.getByLabelText("Email").value).toBe("juan@ejemplo.com");
		// En edición muestra el valor derivado actual y sigue no editable.
		expect(screen.getByLabelText("% Acciones").value).toBe("25");
		expect(screen.getByLabelText("% Acciones").disabled).toBe(true);
		expect(screen.getByLabelText("DNI").value).toBe("30123456");

		await user.clear(screen.getByLabelText("Nombre"));
		await user.type(screen.getByLabelText("Nombre"), "Juan Carlos");
		await user.click(
			screen.getByRole("button", { name: /guardar cambios/i })
		);

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				`${API_URL}/1`,
				expect.objectContaining({ method: "PUT" })
			)
		);
		const putCall = fetchMock.mock.calls.find(
			([, opts]) => opts?.method === "PUT"
		);
		const body = JSON.parse(putCall[1].body);
		expect(body.nombre).toBe("Juan Carlos");
		expect(body.apellido).toBe("Perez");
		expect(body.id).toBe(1);
		expect(body).not.toHaveProperty("porcentajeAcciones");

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(
			screen.getByText("Accionista actualizado correctamente")
		).toBeTruthy();
	});

	it("cierra el popup sin enviar datos al pulsar Cancelar", async () => {
		const fetchMock = mockApi([]);
		vi.stubGlobal("fetch", fetchMock);
		render(<AccionistasManager />);

		await user.click(
			screen.getByRole("button", { name: /agregar accionista/i })
		);
		expect(screen.getByRole("dialog")).toBeTruthy();
		await user.type(screen.getByLabelText("Nombre"), "Ana");
		await user.click(screen.getByRole("button", { name: /cancelar/i }));

		expect(screen.queryByRole("dialog")).toBeNull();
		const sendCalls = fetchMock.mock.calls.filter(
			([, opts]) => opts?.method === "POST" || opts?.method === "PUT"
		);
		expect(sendCalls).toHaveLength(0);
	});

	it("pide confirmación en un popup antes de eliminar y envía DELETE al confirmar", async () => {
		const fetchMock = mockApi([ACCIONISTA]);
		vi.stubGlobal("fetch", fetchMock);
		render(<AccionistasManager />);
		await screen.findByText("Juan");

		await user.click(screen.getByRole("button", { name: /eliminar/i }));

		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeTruthy();
		expect(
			screen.getByText("¿Estás seguro de eliminar este accionista?")
		).toBeTruthy();
		expect(
			fetchMock.mock.calls.filter(([, opts]) => opts?.method === "DELETE")
		).toHaveLength(0);

		await user.click(
			within(dialog).getByRole("button", { name: /eliminar/i })
		);

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				`${API_URL}/1`,
				expect.objectContaining({ method: "DELETE" })
			)
		);
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(screen.getByText("Accionista eliminado correctamente")).toBeTruthy();
	});

	it("cierra el popup de eliminación sin enviar DELETE al pulsar Cancelar", async () => {
		const fetchMock = mockApi([ACCIONISTA]);
		vi.stubGlobal("fetch", fetchMock);
		render(<AccionistasManager />);
		await screen.findByText("Juan");

		await user.click(screen.getByRole("button", { name: /eliminar/i }));
		expect(screen.getByRole("dialog")).toBeTruthy();
		await user.click(screen.getByRole("button", { name: /cancelar/i }));

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(
			fetchMock.mock.calls.filter(([, opts]) => opts?.method === "DELETE")
		).toHaveLength(0);
	});
});

describe("AccionistasManager - permisos por rol", () => {
	let user;

	const TOKEN = "test-token";
	const USER_ROLE = JSON.stringify({ username: "normal", role: "user" });

	beforeEach(() => {
		user = userEvent.setup();
		vi.stubGlobal(
			"localStorage",
			{
				getItem: (k) => (k === "app_token" ? TOKEN : k === "app_user" ? USER_ROLE : null),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn(),
			}
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("no muestra el botón Eliminar para un usuario normal", async () => {
		vi.stubGlobal("fetch", mockApi([ACCIONISTA]));
		render(<AccionistasManager />);

		expect(await screen.findByText("Juan")).toBeTruthy();
		expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
		// Ver/Editar siguen disponibles.
		expect(screen.getByRole("button", { name: "Ver" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
	});

	it("envía el header Authorization en el DELETE (admin)", async () => {
		vi.stubGlobal(
			"localStorage",
			{
				getItem: (k) => (k === "app_token" ? TOKEN : k === "app_user" ? JSON.stringify({ username: "admin", role: "admin" }) : null),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn(),
			}
		);
		const fetchMock = mockApi([ACCIONISTA]);
		vi.stubGlobal("fetch", fetchMock);
		render(<AccionistasManager />);
		await screen.findByText("Juan");

		await user.click(screen.getByRole("button", { name: /eliminar/i }));
		await user.click(
			within(screen.getByRole("dialog")).getByRole("button", { name: /eliminar/i })
		);

		await waitFor(() =>
			expect(
				fetchMock.mock.calls.filter(([, opts]) => opts?.method === "DELETE")
			).toHaveLength(1)
		);
		const delCall = fetchMock.mock.calls.find(([, opts]) => opts?.method === "DELETE");
		expect(delCall[1].headers.Authorization).toBe(`Bearer ${TOKEN}`);
	});
});
