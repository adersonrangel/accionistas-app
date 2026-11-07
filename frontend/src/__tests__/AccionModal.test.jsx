// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccionModal from "../AccionModal";

afterEach(() => {
  cleanup();
});

describe("AccionModal - Code Validation", () => {
  it("shows validation error for invalid code length", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    const onClose = vi.fn();

    render(
      <AccionModal
        open={true}
        accion={{ _id: "1", code: "00001", percentage: 10 }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText("Código");
    await user.clear(input);
    await user.type(input, "123"); // 3 digits

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByText("El código debe tener exactamente 5 dígitos")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("allows saving a valid 5-digit code (percentage kept as number)", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    const onClose = vi.fn();

    render(
      <AccionModal
        open={true}
        accion={{ _id: "1", code: "00001", percentage: 10 }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText("Código");
    await user.clear(input);
    await user.type(input, "00099");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        { code: "00099", percentage: 10 },
        true
      );
    });
  });
});

describe("AccionModal - Percentage", () => {
  it("creates with a valid percentage", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    const onClose = vi.fn();

    render(
      <AccionModal open={true} accion={null} onClose={onClose} onSave={onSave} />
    );

    const input = screen.getByLabelText("Porcentaje");
    await user.type(input, "25.5");

    await user.click(screen.getByRole("button", { name: /crear acción/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ percentage: 25.5 }, false);
    });
  });

  it("blocks creation with an empty percentage", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    const onClose = vi.fn();

    render(
      <AccionModal open={true} accion={null} onClose={onClose} onSave={onSave} />
    );

    await user.click(screen.getByRole("button", { name: /crear acción/i }));

    expect(await screen.findByText("El porcentaje es obligatorio")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("blocks editing with a percentage above 100", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    const onClose = vi.fn();

    render(
      <AccionModal
        open={true}
        accion={{ _id: "1", code: "00001", percentage: 10 }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText("Porcentaje");
    await user.clear(input);
    await user.type(input, "150");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(
      await screen.findByText("El porcentaje debe ser un número entre 0 y 100")
    ).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("edits a legacy accion without percentage: empty field must be filled", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    const onClose = vi.fn();

    render(
      <AccionModal
        open={true}
        accion={{ _id: "1", code: "00001" }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const input = screen.getByLabelText("Porcentaje");
    expect(input.value).toBe("");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByText("El porcentaje es obligatorio")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
