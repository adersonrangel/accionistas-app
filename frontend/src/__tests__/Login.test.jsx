// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../Login";

describe("Login", () => {
  let onLogin;

  beforeEach(() => {
    onLogin = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("envía las credenciales a /api/login y llama a onLogin con el resultado", async () => {
    const json = { token: "tok", username: "admin", role: "admin" };
    const fetchMock = vi.fn(async (url, opts = {}) => {
      return { ok: true, status: 200, json: async () => json };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Login onLogin={onLogin} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "admin");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/login",
      expect.objectContaining({ method: "POST" })
    );
    const call = fetchMock.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body).toEqual({ username: "admin", password: "admin" });
    expect(onLogin).toHaveBeenCalledWith(json);
  });

  it("muestra el error del backend cuando las credenciales son inválidas (401)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: "Usuario o contraseña incorrectos" }),
      }))
    );
    render(<Login onLogin={onLogin} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "mala");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Usuario o contraseña incorrectos")).toBeTruthy();
    expect(onLogin).not.toHaveBeenCalled();
  });
});