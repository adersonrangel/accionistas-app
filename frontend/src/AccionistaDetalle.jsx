import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:3001/api";
const LOGIN_URL = `${API_BASE}/login`;
const ACCIONES_BASE = `${API_BASE}/acciones`;

// Tab "Datos": los campos del accionista (misma fuente que el listado).
function TabDatos({ accionista }) {
	return (
		<table className="table">
			<tbody>
				<tr>
					<th>Nombre</th>
					<td>{accionista.nombre}</td>
				</tr>
				<tr>
					<th>Apellido</th>
					<td>{accionista.apellido}</td>
				</tr>
				<tr>
					<th>DNI</th>
					<td>{accionista.dni}</td>
				</tr>
				<tr>
					<th>Email</th>
					<td>{accionista.email}</td>
				</tr>
				<tr>
					<th>% Acciones</th>
					<td>{accionista.porcentajeAcciones}%</td>
				</tr>
				<tr>
					<th>Fecha Ingreso</th>
					<td>{accionista.fechaIngreso}</td>
				</tr>
				<tr>
					<th>Teléfono</th>
					<td>{accionista.telefono || "—"}</td>
				</tr>
				<tr>
					<th>Dirección</th>
					<td>{accionista.direccion || "—"}</td>
				</tr>
			</tbody>
		</table>
	);
}

// Modal para elegir 1 o varias acciones registradas sin asignar.
function AsignarAccionesModal({ open, onClose, onConfirm, error, cargando, disponibles }) {
	const [seleccion, setSeleccion] = useState([]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (open) setSeleccion([]);
	}, [open]);

	function toggle(_id) {
		setSeleccion((prev) =>
			prev.includes(_id) ? prev.filter((x) => x !== _id) : [...prev, _id]
		);
	}

	if (!open) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
					className="modal card"
					onClick={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
					aria-label="Asignar acciones"
				>
				<h2>Asignar acciones</h2>
				{error && <div className="alert alert-error">{error}</div>}
				{cargando ? (
					<p className="text-muted">Cargando acciones disponibles...</p>
				) : disponibles.length === 0 ? (
					<p className="text-muted">
						No hay acciones registradas sin asignar.
					</p>
				) : (
					<>
						<table className="table">
							<thead>
								<tr>
									<th></th>
									<th>Código</th>
									<th>Porcentaje</th>
								</tr>
							</thead>
							<tbody>
								{disponibles.map((a) => (
									<tr key={a._id}>
										<td>
											<input
												type="checkbox"
												data-testid={`accion-check-${a.code}`}
												checked={seleccion.includes(a._id)}
												onChange={() => toggle(a._id)}
											/>
										</td>
										<td>{a.code}</td>
										<td>{a.percentage != null ? `${a.percentage} %` : "—"}</td>
									</tr>
								))}
							</tbody>
						</table>
						<p className="text-muted">
							Seleccioná 1 o más acciones para asignarlas.
						</p>
					</>
				)}
				<div className="form-actions">
					<button
						className="btn btn-primary"
						disabled={seleccion.length === 0 || cargando}
						onClick={() => onConfirm(seleccion)}
					>
						Asignar seleccionadas
					</button>
					<button type="button" className="btn btn-secondary" onClick={onClose}>
						Cancelar
					</button>
				</div>
			</div>
		</div>
	);
}

// Tab "Acciones": detalle (por ahora el código) de las acciones asignadas,
// con opción de quitarlas y de asignar acciones registradas.
function TabAcciones({ accionista, token, onMensaje }) {
	const [asignadas, setAsignadas] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);
	const [modalAbierto, setModalAbierto] = useState(false);
	const [disponibles, setDisponibles] = useState([]);
	const [modalCargando, setModalCargando] = useState(false);
	const [modalError, setModalError] = useState("");

	const authHeaders = { Authorization: `Bearer ${token}` };

	const cargarAsignadas = useCallback(async () => {
		setCargando(true);
		setError(null);
		try {
			const res = await fetch(
				`${API_BASE}/accionistas/${accionista.id}/acciones`,
				{ headers: authHeaders }
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Error cargando acciones");
			setAsignadas(json.data || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setCargando(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accionista.id, token]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		cargarAsignadas();
	}, [cargarAsignadas]);

	function abrirModal() {
		setModalError("");
		setModalAbierto(true);
		setModalCargando(true);
		fetch(`${ACCIONES_BASE}/disponibles`, { headers: authHeaders })
			.then(async (res) => {
				const json = await res.json();
				if (!res.ok) throw new Error(json.error || "Error cargando acciones");
				setDisponibles(json.data || []);
			})
			.catch((err) => setModalError(err.message))
			.finally(() => setModalCargando(false));
	}

	async function confirmarAsignacion(accionIds) {
		setModalCargando(true);
		setModalError("");
		try {
			const res = await fetch(
				`${API_BASE}/accionistas/${accionista.id}/acciones`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json", ...authHeaders },
					body: JSON.stringify({ accionIds }),
				}
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Ocurrió un problema");
			const n = (json.data || []).length;
			const s = (json.skipped || []).length;
			onMensaje(
				n + s > 0
					? `Se asignaron ${n} acción/es${s > 0 ? ` (${s} ya asignada/s, sin cambios)` : ""}`
					: "Acciones ya asignadas, sin cambios"
			);
			setModalAbierto(false);
			cargarAsignadas();
		} catch (err) {
			setModalError(err.message);
		} finally {
			setModalCargando(false);
		}
	}

	async function quitar(accion) {
		if (!confirm(`¿Quitar la acción ${accion.code}?`)) return;
		try {
			const res = await fetch(
				`${API_BASE}/accionistas/${accionista.id}/acciones/${accion._id}`,
				{ method: "DELETE", headers: authHeaders }
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "No se pudo quitar la acción");
			onMensaje(`Acción ${accion.code} quitada`);
			cargarAsignadas();
		} catch (err) {
			onMensaje(`Error al quitar la acción: ${err.message}`);
		}
	}

	return (
		<div>
			<div style={{ marginBottom: "12px" }}>
				<button className="btn btn-primary" onClick={abrirModal}>
					+ Asignar acciones
				</button>
			</div>
			{error && <div className="alert alert-error">{error}</div>}
			{cargando ? (
				<p className="text-muted">Cargando...</p>
			) : asignadas.length === 0 ? (
				<p className="text-muted">Este accionista no tiene acciones asignadas.</p>
			) : (
				<table className="table">
					<thead>
						<tr>
							<th>Código</th>
							<th>Porcentaje</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{asignadas.map((a) => (
							<tr key={a._id}>
								<td>{a.code}</td>
								<td>{a.percentage != null ? `${a.percentage} %` : "—"}</td>
								<td>
									<button
										className="btn btn-small btn-danger"
										onClick={() => quitar(a)}
									>
										Quitar
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			<AsignarAccionesModal
				open={modalAbierto}
				disponibles={disponibles}
				cargando={modalCargando}
				error={modalError}
				onClose={() => setModalAbierto(false)}
				onConfirm={confirmarAsignacion}
			/>
		</div>
	);
}

export default function AccionistaDetalle({ accionista, onBack, onRefresh }) {
	const [tab, setTab] = useState("datos");
	const [token, setToken] = useState(() => localStorage.getItem("acciones_token"));
	const [loginUsername, setLoginUsername] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const [iniciando, setIniciando] = useState(false);
	const [mensaje, setMensaje] = useState("");

	async function iniciarSesion() {
		setIniciando(true);
		setLoginError("");
		try {
			const res = await fetch(LOGIN_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: loginUsername, password: loginPassword }),
			});
			const json = await res.json();
			if (!res.ok) {
				setLoginError(json.error || "Credenciales inválidas");
				return;
			}
			localStorage.setItem("acciones_token", json.token);
			setToken(json.token);
		} catch (err) {
			setLoginError(`Error de conexión: ${err.message}`);
		} finally {
			setIniciando(false);
		}
	}

	function manejoMensaje(texto) {
		setMensaje(texto);
		onRefresh?.();
	}

	return (
		<div className="container">
			<div className="page-header">
				<h1>
					Accionista: {accionista.nombre} {accionista.apellido}
				</h1>
				<button className="btn btn-secondary" onClick={onBack}>
					← Volver al listado
				</button>
			</div>

			{mensaje && (
				<div
					className={`alert ${mensaje.startsWith("Error") ? "alert-error" : "alert-success"}`}
				>
					{mensaje}
				</div>
			)}

			<nav style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
				<button
					className={`btn ${tab === "datos" ? "btn-primary" : "btn-secondary"}`}
					onClick={() => setTab("datos")}
				>
					Datos
				</button>
				<button
					className={`btn ${tab === "acciones" ? "btn-primary" : "btn-secondary"}`}
					onClick={() => setTab("acciones")}
				>
					Acciones
				</button>
			</nav>

			<section className="card">
				{tab === "datos" ? (
					<TabDatos accionista={accionista} />
				) : token ? (
					<TabAcciones
						accionista={accionista}
						token={token}
						onMensaje={manejoMensaje}
					/>
				) : (
					<div style={{ maxWidth: "400px", margin: "0 auto" }}>
						<h2>Iniciar Sesión</h2>
						<p className="text-muted">
							Acceso requerido para ver y gestionar las acciones.
						</p>
						{loginError && <div className="alert alert-error">{loginError}</div>}
						<div className="form-grid">
							<div className="field">
								<label htmlFor="detalle-login-user">Usuario</label>
								<input
									id="detalle-login-user"
									type="text"
									value={loginUsername}
									onChange={(e) => setLoginUsername(e.target.value)}
								/>
							</div>
							<div className="field">
								<label htmlFor="detalle-login-pass">Contraseña</label>
								<input
									id="detalle-login-pass"
									type="password"
									value={loginPassword}
									onChange={(e) => setLoginPassword(e.target.value)}
								/>
							</div>
							<div className="form-actions">
								<button
									type="button"
									className="btn btn-primary"
									onClick={iniciarSesion}
									disabled={iniciando}
								>
									{iniciando ? "Iniciando..." : "Entrar"}
								</button>
							</div>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}
