import { useState, useEffect } from "react";
import { useValidatedForm } from "./shared/validation";

const API_URL = "http://localhost:3001/api/accionistas";

export default function AccionistasManager() {
	const [accionistas, setAccionistas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [editando, setEditando] = useState(false);
	const [mensaje, setMensaje] = useState("");

	// Validation rules for each field
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

	const initialValues = {
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

	const {
		getFieldProps,
		handleSubmit,
		reset: resetForm,
		fieldErrors,
	} = useValidatedForm(initialValues, fieldRules);

	async function cargarAccionistas() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(API_URL);
			const json = await res.json();
			setAccionistas(json.data || []);
		} catch (err) {
			console.error(err);
			setError(
				"No se pudo conectar con el backend. ¿Está corriendo en el puerto 3001?",
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		cargarAccionistas();
	}, []);

	function handleCreateOrUpdate(data) {
		// data contains all fields including id if editing
		const payload = { ...data };
		if (!editando) delete payload.id;

		const url = editando ? `${API_URL}/${data.id}` : API_URL;
		const method = editando ? "PUT" : "POST";

		fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		})
			.then(async (res) => {
				const json = await res.json();
				if (!res.ok) {
					throw new Error(json.error || "Ocurrió un problema");
				}
				return json;
			})
			.then(() => {
				setMensaje(
					editando
						? "Accionista actualizado correctamente"
						: "Accionista creado correctamente",
				);
				resetForm();
				setEditando(false);
				cargarAccionistas();
			})
			.catch((err) => {
				setMensaje(`Error: ${err.message}`);
			});
	}

	const handleSubmitWrapper = handleSubmit(handleCreateOrUpdate);

	function fillFormEdit(acc) {
		setEditando(true);
		resetForm(acc);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function resetFormHandler() {
		resetForm();
		setEditando(false);
		setMensaje("");
	}

	function eliminar(id) {
		if (!confirm("¿Estás seguro de eliminar este accionista?")) return;
		fetch(`${API_URL}/${id}`, { method: "DELETE" })
			.then(async (res) => {
				const json = await res.json();
				if (!res.ok) {
					throw new Error(json.error || "No se pudo eliminar");
				}
				return json;
			})
			.then(() => {
				setMensaje("Accionista eliminado correctamente");
				cargarAccionistas();
			})
			.catch((err) => {
				setMensaje(`Error de conexión al eliminar: ${err.message}`);
			});
	}

	return (
		<div className="container">
			<h1>🏨 Administración de Accionistas</h1>

			{mensaje && (
				<div
					className={`alert ${mensaje.startsWith("Error") ? "alert-error" : "alert-success"}`}
				>
					{mensaje}
				</div>
			)}

			<section className="card">
				<h2>{editando ? "Editar Accionista" : "Nuevo Accionista"}</h2>
				<form onSubmit={handleSubmitWrapper} className="form-grid">
					<div className="field">
						<label>Nombre</label>
						<input
							id="nombre"
							{...getFieldProps("nombre")}
							required
							aria-describedby={fieldErrors.nombre ? "nombre-error" : undefined}
						/>
						{fieldErrors.nombre && (
							<span id="nombre-error" role="alert" aria-live="polite">
								{fieldErrors.nombre}
							</span>
						)}
					</div>
					<div className="field">
						<label>Apellido</label>
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
						<label>DNI</label>
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
						<label>Email</label>
						<input
							type="email"
							id="email"
							{...getFieldProps("email")}
							required
							aria-describedby={fieldErrors.email ? "email-error" : undefined}
						/>
						{fieldErrors.email && (
							<span id="email-error" role="alert" aria-live="polite">
								{fieldErrors.email}
							</span>
						)}
					</div>
					<div className="field">
						<label>% Acciones</label>
						<input
							type="number"
							step="0.01"
							id="porcentajeAcciones"
							{...getFieldProps("porcentajeAcciones")}
							required
							aria-describedby={
								fieldErrors.porcentajeAcciones ? "porcentaje-error" : undefined
							}
						/>
						{fieldErrors.porcentajeAcciones && (
							<span id="porcentaje-error" role="alert" aria-live="polite">
								{fieldErrors.porcentajeAcciones}
							</span>
						)}
					</div>
					<div className="field">
						<label>Fecha de Ingreso</label>
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
						<label>Teléfono</label>
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
						<label>Dirección</label>
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
						<button type="submit" className="btn btn-primary">
							{editando ? "Guardar Cambios" : "Crear Accionista"}
						</button>
						{editando && (
							<button
								type="button"
								className="btn btn-secondary"
								onClick={resetFormHandler}
							>
								Cancelar
							</button>
						)}
					</div>
				</form>
			</section>

			<section className="card">
				<h2>Listado de Accionistas</h2>
				{loading ? (
					<p className="text-muted">Cargando...</p>
				) : error ? (
					<div className="alert alert-error">{error}</div>
				) : accionistas.length === 0 ? (
					<p className="text-muted">No hay accionistas registrados.</p>
				) : (
					<table className="table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Nombre</th>
								<th>Apellido</th>
								<th>DNI</th>
								<th>Email</th>
								<th>% Acciones</th>
								<th>Fecha Ingreso</th>
								<th>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{accionistas.map((a) => (
								<tr key={a.id}>
									<td>{a.id}</td>
									<td>{a.nombre}</td>
									<td>{a.apellido}</td>
									<td>{a.dni}</td>
									<td>{a.email}</td>
									<td>{a.porcentajeAcciones}%</td>
									<td>{a.fechaIngreso}</td>
									<td>
										<button
											className="btn btn-small"
											onClick={() => fillFormEdit(a)}
										>
											Editar
										</button>
										<button
											className="btn btn-small btn-danger"
											onClick={() => eliminar(a.id)}
										>
											Eliminar
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>
		</div>
	);
}
