// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccionesManager from "../AccionesManager";

const ACCION = {
	_id: "a1",
	code: "AC-001",
	percentage: "5",
	nochesDeBeneficio: 7,
	shareholderId: "Juan Perez",
	createdAt: "2024-01-15",
	updatedAt: "2024-01-15",
};

function mockApi(acciones) {
	return vi.fn(async (url, opts = {}) => {
		const method = (opts.method || "GET").toUpperCase();
		if (url.includes("/acciones/total")) {
			return { ok: true, status: 200, json: async () => ({ data: { totalPercentage: 5 } }) };
		}
		if (method === "GET") {
			return { ok: true, status: 200, json: async () => ({ data: acciones }) };
		}
		return { ok: true, status: 200, json: async () => ({ ok: true }) };
	});
}

function setupLocalStorage(initial) {
	const store = { ...(initial || {}) };
	return {
		getItem: (k) => (k in store ? store[k] : null),
		setItem: (k, v) => {
			store[k] = String(v);
		},
		removeItem: (k) => {
			delete store[k];
		},
		clear: () => {
			for (const k of Object.keys(store)) delete store[k];
		},
	};
}

describe("AccionesManager", () => {
	let user;

	beforeEach(() => {
		user = userEvent.setup();
		vi.stubGlobal("localStorage", setupLocalStorage({ app_token: "test-token" }));
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("pide confirmación en un popup antes de eliminar y envía DELETE al confirmar", async () => {
		const fetchMock = mockApi([ACCION]);
		vi.stubGlobal("fetch", fetchMock);
		render(<AccionesManager />);
		await screen.findByText("AC-001");

		await user.click(screen.getByRole("button", { name: /eliminar/i }));

		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeTruthy();
		expect(
			screen.getByText("¿Estás seguro de eliminar esta acción?")
		).toBeTruthy();
		expect(
			fetchMock.mock.calls.filter(([, opts]) => opts?.method === "DELETE")
		).toHaveLength(0);

		await user.click(within(dialog).getByRole("button", { name: /eliminar/i }));

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				"http://localhost:3001/api/acciones/a1",
				expect.objectContaining({ method: "DELETE" })
			)
		);
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(screen.getByText("Acción eliminada correctamente")).toBeTruthy();
	});
});
