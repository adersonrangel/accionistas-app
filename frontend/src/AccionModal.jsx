import { useState } from "react";
import { useValidatedForm } from "./shared/validation";

const percentageRules = [
  { type: "required", message: "El porcentaje es obligatorio" },
  {
    type: "range",
    params: { min: 0, max: 100 },
    message: "El porcentaje debe ser un número entre 0 y 100",
  },
];

function PercentageField({ getFieldProps, fieldErrors }) {
  return (
    <div className="field">
      <label htmlFor="percentage">Porcentaje</label>
      <input
        id="percentage"
        type="number"
        step="0.01"
        min="0"
        max="100"
        {...getFieldProps("percentage")}
        aria-describedby={fieldErrors.percentage ? "percentage-error" : undefined}
      />
      {fieldErrors.percentage && (
        <span id="percentage-error" role="alert" aria-live="polite">
          {fieldErrors.percentage}
        </span>
      )}
    </div>
  );
}

function AccionForm({ esEdicion, initialValues, onClose, onSave }) {
  const { getFieldProps, handleSubmit, fieldErrors } = useValidatedForm(
    initialValues,
    esEdicion
      ? {
          code: [
            { type: "required", message: "El código es obligatorio" },
            {
              type: "pattern",
              params: { pattern: "^\\d{5}$" },
              message: "El código debe tener exactamente 5 dígitos",
            },
          ],
          percentage: percentageRules,
        }
      : { percentage: percentageRules }
  );
  const [serverError, setServerError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function handleValidSubmit(values) {
    setGuardando(true);
    const payload = { ...values, percentage: Number(values.percentage) };
    const err = await onSave(payload, esEdicion);
    if (err) {
      setServerError(err);
      setGuardando(false);
    }
  }

  return (
    <>
      <h2>{esEdicion ? "Editar Acción" : "Nueva Acción"}</h2>
      {serverError && <div className="alert alert-error">{serverError}</div>}
      <form onSubmit={handleSubmit(handleValidSubmit)} className="form-grid">
        {esEdicion && (
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
        )}
        {!esEdicion && (
          <p className="text-muted">
            El código de la acción se generará automáticamente como el próximo
            código secuencial de 5 dígitos.
          </p>
        )}
        <PercentageField getFieldProps={getFieldProps} fieldErrors={fieldErrors} />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando
              ? esEdicion
                ? "Guardando..."
                : "Creando..."
              : esEdicion
                ? "Guardar Cambios"
                : "Crear Acción"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </>
  );
}

export default function AccionModal({ open, accion, onClose, onSave }) {
  const esEdicion = accion !== null;
  if (!open) return null;
  const initialValues = esEdicion
    ? { code: accion.code, percentage: accion.percentage ?? "" }
    : { percentage: "" };
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
