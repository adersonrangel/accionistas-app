import { useState } from "react";
import { useValidatedForm } from "./shared/validation";

const initialValuesVacios = {
	id: null,
	nombre: "",
	apellido: "",
	dni: "",
	email: "",
	porcentajeAcciones: "",
	fechaIngreso: "",
	telefono: "",
	direccion: "",
};

// Mismas reglas de validación que tenía el formulario inline
const fieldRules = {
	nombre: [{ type: "required" }],
	apellido: [{ type: "required" }],
	dni: [{ type: "required" }],
	email: [
		{ type: "required" },
		{
			type: "pattern",
			params: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
		},
	],
	porcentajeAcciones: [{ type: "required" }],
	fechaIngreso: [{ type: "required" }],
	telefono: [],
	direccion: [],
};

/**
 * Formulario del pop-up. Recibe sus valores iniciales por prop y se
 * remonta (key) cada vez que se abre el modal, así el estado es fresco
 * sin necesitar efectos de reinicio.
 */
function AccionistaForm({ initialValues, esEdicion, onClose, onSave }) {
	const { getFieldProps, handleSubmit, fieldErrors } = useValidatedForm(
		initialValues ?? initialValuesVacios,
		fieldRules
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

	return (
		<>
			<h2>{esEdicion ? "Editar Accionista" : "Nuevo Accionista"}</h2>

			{serverError && <div className="alert alert-error">{serverError}</div>}

			<form onSubmit={handleSubmit(handleValidSubmit)} className="form-grid">
				<div className="field">
					<label htmlFor="nombre">Nombre</label>
					<input
						id="nombre"
						{...getFieldProps("nombre")}
						required
						aria-describedby={
							fieldErrors.nombre ? "nombre-error" : undefined
						}
					/>
					{fieldErrors.nombre && (
						<span id="nombre-error" role="alert" aria-live="polite">
							{fieldErrors.nombre}
						</span>
					)}
				</div>
				<div className="field">
					<label htmlFor="apellido">Apellido</label>
					<input
						id="apellido"
						{...getFieldProps("apellido")}
						required
						aria-describedby={
							fieldErrors.apellido ? "apellido-error" : undefined
						}
					/>
					{fieldErrors.apellido && (
						<span id="apellido-error" role="alert" aria-live="polite">
							{fieldErrors.apellido}
						</span>
					)}
				</div>
				<div className="field">
					<label htmlFor="dni">DNI</label>
					<input
						id="dni"
						{...getFieldProps("dni")}
						required
						aria-describedby={fieldErrors.dni ? "dni-error" : undefined}
					/>
					{fieldErrors.dni && (
						<span id="dni-error" role="alert" aria-live="polite">
							{fieldErrors.dni}
						</span>
					)}
				</div>
				<div className="field">
					<label htmlFor="email">Email</label>
					<input
						type="email"
						id="email"
						{...getFieldProps("email")}
						required
						aria-describedby={
							fieldErrors.email ? "email-error" : undefined
						}
					/>
					{fieldErrors.email && (
						<span id="email-error" role="alert" aria-live="polite">
							{fieldErrors.email}
						</span>
					)}
				</div>
				<div className="field">
					<label htmlFor="porcentajeAcciones">% Acciones</label>
					<input
						type="number"
						step="0.01"
						id="porcentajeAcciones"
						{...getFieldProps("porcentajeAcciones")}
						required
						aria-describedby={
							fieldErrors.porcentajeAcciones
								? "porcentaje-error"
								: undefined
						}
					/>
					{fieldErrors.porcentajeAcciones && (
						<span id="porcentaje-error" role="alert" aria-live="polite">
							{fieldErrors.porcentajeAcciones}
						</span>
					)}
				</div>
				<div className="field">
					<label htmlFor="fechaIngreso">Fecha de Ingreso</label>
					<input
						type="date"
						id="fechaIngreso"
						{...getFieldProps("fechaIngreso")}
						required
						aria-describedby={
							fieldErrors.fechaIngreso ? "fecha-error" : undefined
						}
					/>
					{fieldErrors.fechaIngreso && (
						<span id="fecha-error" role="alert" aria-live="polite">
							{fieldErrors.fechaIngreso}
						</span>
					)}
				</div>
				<div className="field">
					<label htmlFor="telefono">Teléfono</label>
					<input
						id="telefono"
						{...getFieldProps("telefono")}
						aria-describedby={
							fieldErrors.telefono ? "telefono-error" : undefined
						}
					/>
					{fieldErrors.telefono && (
						<span id="telefono-error" role="alert" aria-live="polite">
							{fieldErrors.telefono}
						</span>
					)}
				</div>
				<div className="field">
					<label htmlFor="direccion">Dirección</label>
					<input
						id="direccion"
						{...getFieldProps("direccion")}
						aria-describedby={
							fieldErrors.direccion ? "direccion-error" : undefined
						}
					/>
					{fieldErrors.direccion && (
						<span id="direccion-error" role="alert" aria-live="polite">
							{fieldErrors.direccion}
						</span>
					)}
				</div>
				<div className="form-actions">
					<button type="submit" className="btn btn-primary" disabled={guardando}>
						{guardando
							? "Guardando..."
							: esEdicion
								? "Guardar Cambios"
								: "Crear Accionista"}
					</button>
					<button type="button" className="btn btn-secondary" onClick={onClose}>
						Cancelar
					</button>
				</div>
			</form>
		</>
	);
}

/**
 * Pop-up para crear o editar un accionista.
 *
 * Props:
 * - open: si el modal está visible
 * - accionista: null para crear, objeto accionista para editar
 * - onClose: cierra el modal sin enviar
 * - onSave: async (values, esEdicion) => errorString | null
 *   Si resuelve con error se muestra dentro del modal y el formulario se
 *   conserva; si resuelve con null el padre cierra el modal.
 */
export default function AccionistaModal({ open, accionista, onClose, onSave }) {
	const esEdicion = accionista !== null;

	if (!open) return null;

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
				aria-label={esEdicion ? "Editar Accionista" : "Nuevo Accionista"}
			>
				<AccionistaForm
					key={esEdicion ? `edit-${accionista.id}` : "new"}
					initialValues={esEdicion ? accionista : null}
					esEdicion={esEdicion}
					onClose={onClose}
					onSave={onSave}
				/>
			</div>
		</div>
	);
}
