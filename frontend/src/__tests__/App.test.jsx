// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const TOKEN = "test-token";
const ADMIN_USER = JSON.stringify({ username: "admin", role: "admin" });
const USER_USER = JSON.stringify({ username: "juan", role: "user" });

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

function mockFetch() {
  return vi.fn(async (url, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    if (method === "POST" && url.includes("/login")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ token: TOKEN, username: "admin", role: "admin" }),
      };
    }
    if (url.includes("/me")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ username: "admin", role: "admin" }),
      };
    }
    return { ok: true, status: 200, json: async () => ({ data: [], total: 0 }) };
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App - puerta de entrada central", () => {
  it("sin sesión muestra el formulario de login", async () => {
    vi.stubGlobal("localStorage", setupLocalStorage({}));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Iniciar Sesión" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accionistas" })).toBeNull();
  });

  it("con sesión de admin muestra la navegación completa (Accionistas, Acciones, Usuarios)", async () => {
    vi.stubGlobal(
      "localStorage",
      setupLocalStorage({ app_token: TOKEN, app_user: ADMIN_USER })
    );
    render(<App />);

    await screen.findByRole("button", { name: "Accionistas" });
    expect(screen.getByRole("button", { name: "Acciones" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Usuarios" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
    expect(screen.getByText("admin")).toBeTruthy();
    expect(screen.getByText("Administrador")).toBeTruthy();
  });

  it("con sesión de usuario normal solo muestra Accionistas", async () => {
    vi.stubGlobal(
      "localStorage",
      setupLocalStorage({ app_token: TOKEN, app_user: USER_USER })
    );
    render(<App />);

    await screen.findByRole("button", { name: "Accionistas" });
    expect(screen.queryByRole("button", { name: "Acciones" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Usuarios" })).toBeNull();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
    expect(screen.getByText("juan")).toBeTruthy();
    expect(screen.getByText("Normal")).toBeTruthy();
  });

  it("cierra sesión al pulsar Cerrar sesión y vuelve al login", async () => {
    const store = setupLocalStorage({ app_token: TOKEN, app_user: ADMIN_USER });
    vi.stubGlobal("localStorage", store);
    render(<App />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Cerrar sesión" }));

    expect(await screen.findByRole("heading", { name: "Iniciar Sesión" })).toBeTruthy();
    expect(store.getItem("app_token")).toBeNull();
    expect(store.getItem("app_user")).toBeNull();
  });

  it("recupera la sesión vía /api/me cuando hay token pero no usuario guardado", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", setupLocalStorage({ app_token: TOKEN }));
    render(<App />);

    await screen.findByRole("button", { name: "Accionistas" });
    expect(screen.getByRole("button", { name: "Usuarios" })).toBeTruthy();
    const meCalls = fetchMock.mock.calls.filter(([url]) => url.includes("/me"));
    expect(meCalls).toHaveLength(1);
    expect(meCalls[0][1].headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("ingresa con las credenciales y muestra la navegación de admin", async () => {
    vi.stubGlobal("localStorage", setupLocalStorage({}));
    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "admin");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByRole("button", { name: "Accionistas" });
    expect(screen.getByRole("button", { name: "Usuarios" })).toBeTruthy();
  });
});