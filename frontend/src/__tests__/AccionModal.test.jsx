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
        accion={{ _id: "1", code: "00001" }}
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

  it("allows saving a valid 5-digit code", async () => {
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

    const input = screen.getByLabelText("Código");
    await user.clear(input);
    await user.type(input, "00099");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        { code: "00099" },
        true
      );
    });
  });
});