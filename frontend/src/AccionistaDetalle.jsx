import { useState, useEffect, useCallback } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";

const API_BASE = "http://localhost:3001/api";
const ACCIONES_BASE = `${API_BASE}/acciones`;

function safeGetItem(key) {
	try { return localStorage.getItem(key); } catch { return null; }
}

function getSession() {
	const t = safeGetItem("app_token");
	const headers = t ? { Authorization: `Bearer ${t}` } : {};
	const raw = t ? safeGetItem("app_user") : null;
	const user = raw ? JSON.parse(raw) : { username: "", role: "" };
	return { token: t, headers, user };
}

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
					<th>Identificación</th>
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

// Suma las noches de beneficio de una lista de acciones.
// Ausente o null cuenta como 0.
function sumarNochesDeBeneficio(acciones) {
	return acciones.reduce(
		(total, a) => total + (a.nochesDeBeneficio != null ? a.nochesDeBeneficio : 0),
		0
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
									<th>Noches de beneficio</th>
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
										<td>{a.nochesDeBeneficio != null ? a.nochesDeBeneficio : "—"}</td>
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
// con opción de quitarlas y de asignar acciones registradas (solo admin).
// Para el rol normal es solo lectura: ve las asignadas, sin controles de escritura.
// La lista la carga el padre (junto con el detalle), así el total de noches
// aparece de una; acá solo se consume por props y se pide refresh tras mutar.
function TabAcciones({
	accionista,
	token,
	onMensaje,
	isAdmin,
	acciones,
	cargando,
	error,
	onRefresh,
}) {
	const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
	const [modalAbierto, setModalAbierto] = useState(false);
	const [disponibles, setDisponibles] = useState([]);
	const [modalCargando, setModalCargando] = useState(false);
	const [modalError, setModalError] = useState("");
	const [accionQuitando, setAccionQuitando] = useState(null);

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
			onRefresh();
		} catch (err) {
			setModalError(err.message);
		} finally {
			setModalCargando(false);
		}
	}

	function solicitarQuitar(accion) {
		setAccionQuitando(accion);
	}

	async function confirmarQuitar() {
		const accion = accionQuitando;
		setAccionQuitando(null);
		try {
			const res = await fetch(
				`${API_BASE}/accionistas/${accionista.id}/acciones/${accion._id}`,
				{ method: "DELETE", headers: authHeaders }
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "No se pudo quitar la acción");
			onMensaje(`Acción ${accion.code} quitada`);
			onRefresh();
		} catch (err) {
			onMensaje(`Error al quitar la acción: ${err.message}`);
		}
	}

	return (
		<div>
			{isAdmin && (
				<div className="detail-actions">
					<button className="btn btn-primary" onClick={abrirModal}>
						+ Asignar acciones
					</button>
				</div>
			)}
			{error && <div className="alert alert-error">{error}</div>}
			{cargando ? (
				<p className="text-muted">Cargando...</p>
			) : acciones.length === 0 ? (
				<p className="text-muted">Este accionista no tiene acciones asignadas.</p>
			) : (
				<table className="table">
					<thead>
						<tr>
							<th>Código</th>
							<th>Porcentaje</th>
							<th>Noches de beneficio</th>
							{isAdmin && <th>Acciones</th>}
						</tr>
					</thead>
					<tbody>
						{acciones.map((a) => (
							<tr key={a._id}>
								<td>{a.code}</td>
								<td>{a.percentage != null ? `${a.percentage} %` : "—"}</td>
								<td>{a.nochesDeBeneficio != null ? a.nochesDeBeneficio : "—"}</td>
								{isAdmin && (
									<td>
										<button
											className="btn btn-small btn-danger"
											onClick={() => solicitarQuitar(a)}
										>
											Quitar
										</button>
									</td>
								)}
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

			<ConfirmDialog
				open={accionQuitando !== null}
				title="Quitar acción"
				message={`¿Quitar la acción ${accionQuitando?.code}?`}
				confirmLabel="Quitar"
				onConfirm={confirmarQuitar}
				onCancel={() => setAccionQuitando(null)}
			/>
		</div>
	);
}

export default function AccionistaDetalle({ accionista, onBack, onRefresh }) {
	const { token: appToken, headers: appHeaders, user: currentUser } = getSession();
	const isAdmin = currentUser.role === "admin";

	const [tab, setTab] = useState("datos");
	const [mensaje, setMensaje] = useState("");
	// Las acciones asignadas viven acá para que el total de noches se cargue
	// al abrir el detalle, sin necesidad de entrar al tab Acciones.
	const [acciones, setAcciones] = useState([]);
	const [cargando, setCargando] = useState(appToken != null);
	const [error, setError] = useState(null);

	const cargarAcciones = useCallback(async () => {
		setCargando(true);
		setError(null);
		try {
			const res = await fetch(
				`${API_BASE}/accionistas/${accionista.id}/acciones`,
				{ headers: appHeaders }
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Error cargando acciones");
			setAcciones(json.data || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setCargando(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accionista.id]);

	useEffect(() => {
		// Sin sesión no se pide nada: el total queda en 0 (y no hay tab Acciones).
		if (!appToken) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		cargarAcciones();
	}, [cargarAcciones, appToken]);

	const totalNoches = sumarNochesDeBeneficio(acciones);

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

			<section className="card">
				<h2>Total de Noches de Beneficio</h2>
				<p className="total-porcentaje" data-testid="total-noches-beneficio">
					{totalNoches.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
				</p>
			</section>

			<nav className="detail-tabs">
				<button
					className={`btn ${tab === "datos" ? "btn-primary" : "btn-secondary"}`}
					onClick={() => setTab("datos")}
				>
					Datos
				</button>
				{appToken && (
					<button
						className={`btn ${tab === "acciones" ? "btn-primary" : "btn-secondary"}`}
						onClick={() => setTab("acciones")}
					>
						Acciones
					</button>
				)}
			</nav>

			<section className="card">
				{tab === "datos" ? (
					<TabDatos accionista={accionista} />
				) : appToken ? (
					<TabAcciones
						accionista={accionista}
						token={appToken}
						isAdmin={isAdmin}
						onMensaje={manejoMensaje}
						acciones={acciones}
						cargando={cargando}
						error={error}
						onRefresh={cargarAcciones}
					/>
				) : (
					<p className="text-muted">Sin acceso a acciones.</p>
				)}
			</section>
		</div>
	);
}