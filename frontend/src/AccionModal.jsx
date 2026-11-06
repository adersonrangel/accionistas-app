import { useState } from "react";
import { useValidatedForm } from "./shared/validation";

const codeRules = {
  code: [
    { type: "required", message: "El código es obligatorio" },
    {
      type: "pattern",
      params: { pattern: "^\\d{5}$" },
      message: "El código debe tener exactamente 5 dígitos",
    },
  ],
};

function AccionForm({ esEdicion, initialValues, onClose, onSave }) {
  const { getFieldProps, handleSubmit, fieldErrors } = useValidatedForm(
    initialValues,
    esEdicion ? codeRules : {}
  );
  const [serverError, setServerError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function handleValidSubmit(values) {
    setGuardando(true);
    const err = await onSave(values, esEdicion);
    if (err) {
      setServerError(err);
      setGuardando(false);
    }
  }

  async function handleCreate() {
    setGuardando(true);
    const err = await onSave({}, false);
    if (err) {
      setServerError(err);
      setGuardando(false);
    }
  }

  return (
    <>
      <h2>{esEdicion ? "Editar Acción" : "Nueva Acción"}</h2>
      {serverError && <div className="alert alert-error">{serverError}</div>}
      {esEdicion ? (
        <form onSubmit={handleSubmit(handleValidSubmit)} className="form-grid">
          <div className="field">
            <label htmlFor="code">Código</label>
            <input
              id="code"
              {...getFieldProps("code")}
              required
              maxLength={5}
              aria-describedby={fieldErrors.code ? "code-error" : undefined}
            />
            {fieldErrors.code && (
              <span id="code-error" role="alert" aria-live="polite">
                {fieldErrors.code}
              </span>
            )}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="text-muted">
            El código de la acción se generará automáticamente como el próximo
            código secuencial de 5 dígitos.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={guardando}
              onClick={handleCreate}
            >
              {guardando ? "Creando..." : "Crear Acción"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AccionModal({ open, accion, onClose, onSave }) {
  const esEdicion = accion !== null;
  if (!open) return null;
  const initialValues = esEdicion ? { code: accion.code } : {};
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={esEdicion ? "Editar Acción" : "Nueva Acción"}
      >
        <AccionForm
          key={esEdicion ? `edit-${accion._id}` : "new"}
          esEdicion={esEdicion}
          initialValues={initialValues}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}