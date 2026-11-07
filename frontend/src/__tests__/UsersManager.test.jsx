// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersManager from "../UsersManager";

const API_URL = "http://localhost:3001/api/users";
const TOKEN = "test-token";

const USUARIOS = [
  { id: "u1", username: "admin", role: "admin", createdAt: "2024-01-01" },
  { id: "u2", username: "juan", role: "user", createdAt: "2024-02-01" },
];

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

function mockApi() {
  return vi.fn(async (url, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    if (method === "GET") {
      return { ok: true, json: async () => ({ data: USUARIOS }) };
    }
    if (method === "POST" || method === "PUT") {
      return { ok: true, json: async () => ({ data: USUARIOS }) };
    }
    return { ok: true, json: async () => ({ message: "ok" }) };
  });
}

describe("UsersManager", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.stubGlobal("localStorage", setupLocalStorage({ app_token: TOKEN }));
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("muestra la lista de usuarios con su rol", async () => {
    vi.stubGlobal("fetch", mockApi());
    render(<UsersManager />);

    expect(await screen.findByText("admin")).toBeTruthy();
    expect(screen.getByText("juan")).toBeTruthy();
    expect(screen.getByText("Administrador")).toBeTruthy();
    expect(screen.getByText("Normal")).toBeTruthy();
  });

  it("crea un usuario (POST /api/users) con usuario, contraseña y rol", async () => {
    const fetchMock = mockApi();
    vi.stubGlobal("fetch", fetchMock);
    render(<UsersManager />);
    await screen.findByText("admin");

    await user.click(screen.getByRole("button", { name: "+ Nuevo Usuario" }));
    expect(screen.getByRole("heading", { name: "Nuevo Usuario" })).toBeTruthy();

    await user.type(screen.getByLabelText("Usuario"), "nuevo");
    await user.type(screen.getByLabelText(/Contraseña/), "pass1234");
    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "admin" } });
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        API_URL,
        expect.objectContaining({ method: "POST" })
      )
    );
    const postCall = fetchMock.mock.calls.find(([, opts]) => opts?.method === "POST");
    const body = JSON.parse(postCall[1].body);
    expect(body).toEqual({ username: "nuevo", role: "admin", password: "pass1234" });
    expect(screen.getByText("Usuario creado correctamente")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Nuevo Usuario" })).toBeNull();
  });

  it("muestra el error de creación cuando el usuario ya existe (409)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, opts = {}) => {
        if ((opts.method || "GET").toUpperCase() === "POST") {
          return {
            ok: false,
            status: 409,
            json: async () => ({ error: "El nombre de usuario ya existe" }),
          };
        }
        return { ok: true, json: async () => ({ data: USUARIOS }) };
      })
    );
    render(<UsersManager />);
    await screen.findByText("admin");

    await user.click(screen.getByRole("button", { name: "+ Nuevo Usuario" }));
    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText(/Contraseña/), "pass1234");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(await screen.findByText("El nombre de usuario ya existe")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nuevo Usuario" })).toBeTruthy();
  });

  it("edita un usuario (PUT /api/users/:id) prellenando el formulario", async () => {
    const fetchMock = mockApi();
    vi.stubGlobal("fetch", fetchMock);
    render(<UsersManager />);
    await screen.findByText("juan");

    const fila = screen.getByText("juan").closest("tr");
    await user.click(
      fila.querySelector('button') // primer botón de la fila: Editar
    );

    expect(screen.getByRole("heading", { name: "Editar Usuario" })).toBeTruthy();
    expect(screen.getByLabelText("Usuario").value).toBe("juan");
    expect(screen.getByLabelText("Rol").value).toBe("user");

    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "admin" } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_URL}/u2`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const putCall = fetchMock.mock.calls.find(([, opts]) => opts?.method === "PUT");
    const body = JSON.parse(putCall[1].body);
    expect(body).toEqual({ username: "juan", role: "admin" });
    expect(screen.getByText("Usuario actualizado correctamente")).toBeTruthy();
  });

  it("elimina un usuario (DELETE /api/users/:id) con confirmación", async () => {
    const fetchMock = mockApi();
    vi.stubGlobal("fetch", fetchMock);
    render(<UsersManager />);
    await screen.findByText("juan");

    const fila = screen.getByText("juan").closest("tr");
    const botones = fila.querySelectorAll("button");
    await user.click(botones[botones.length - 1]); // último botón: Eliminar

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_URL}/u2`,
        expect.objectContaining({ method: "DELETE" })
      )
    );
    expect(await screen.findByText("Usuario eliminado correctamente")).toBeTruthy();
    expect(globalThis.confirm).toHaveBeenCalled();
  });

  it("muestra el error de eliminación cuando es el último admin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, opts = {}) => {
        const method = (opts.method || "GET").toUpperCase();
        if (method === "DELETE") {
          return {
            ok: false,
            status: 409,
            json: async () => ({ error: "No se puede eliminar el último administrador" }),
          };
        }
        return { ok: true, json: async () => ({ data: USUARIOS }) };
      })
    );
    render(<UsersManager />);
    await screen.findByText("admin");

    const fila = screen.getByText("admin").closest("tr");
    const botones = fila.querySelectorAll("button");
    await user.click(botones[botones.length - 1]);

    expect(
      await screen.findByText("Error: No se puede eliminar el último administrador")
    ).toBeTruthy();
  });
});