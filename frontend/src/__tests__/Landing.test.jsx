// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import Landing from "../Landing";

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

beforeEach(() => {
  vi.stubGlobal("localStorage", setupLocalStorage({}));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, opts = {}) => {
      if ((opts.method || "GET").toUpperCase() === "POST" && url.includes("/login")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ token: "tok", username: "admin", role: "admin" }),
        };
      }
      return { ok: true, status: 200, json: async () => ({ data: [], total: 0 }) };
    })
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Landing — landing page con login integrado", () => {
  it("sin sesión muestra la landing con el login en la misma página", async () => {
    render(<App />);

    // Hero de la landing
    expect(
      await screen.findByRole("heading", { name: "Toda la propiedad de tu hotel, en un solo lugar" })
    ).toBeTruthy();

    // El login vive en la misma página, junto al hero
    expect(screen.getByRole("heading", { name: "Iniciar Sesión" })).toBeTruthy();
    expect(screen.getByLabelText("Usuario")).toBeTruthy();
    expect(screen.getByLabelText("Contraseña")).toBeTruthy();

    // Sección de módulos
    expect(screen.getByRole("heading", { name: "Accionistas" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Seguridad" })).toBeTruthy();
  });

  it("el login integrado envía credenciales a /api/login y llama a onLogin", async () => {
    const onLogin = vi.fn();
    const fetchMock = vi.fn(async (url, opts = {}) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({ token: "tok", username: "admin", role: "admin" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Landing onLogin={onLogin} />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "admin");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/login",
      expect.objectContaining({ method: "POST" })
    );
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ username: "admin", role: "admin" })
    );
  });
});
