import { useState, useEffect } from "react";
import AccionistaModal from "./AccionistaModal.jsx";
import AccionistaDetalle from "./AccionistaDetalle.jsx";
import Pagination from "./Pagination.jsx";

const API_URL = "http://localhost:3001/api/accionistas";

export default function AccionistasManager() {
	const [accionistas, setAccionistas] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [mensaje, setMensaje] = useState("");
	const [modalAbierto, setModalAbierto] = useState(false);
	const [accionistaEditando, setAccionistaEditando] = useState(null);
	const [accionistaDetallando, setAccionistaDetallando] = useState(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	async function cargarAccionistas() {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: String(page),
				pageSize: String(pageSize),
			});
			const res = await fetch(`${API_URL}?${params}`);
			const json = await res.json();
			setAccionistas(json.data || []);
			setTotal(json.total || json.data.length);
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
	}, [page, pageSize]);

	function abrirModalNuevo() {
		setAccionistaEditando(null);
		setModalAbierto(true);
	}

	function abrirModalEdicion(acc) {
		setAccionistaEditando(acc);
		setModalAbierto(true);
	}

	function cerrarModal() {
		setModalAbierto(false);
		setAccionistaEditando(null);
	}

	async function guardarAccionista(values, esEdicion) {
		const payload = { ...values };
		if (!esEdicion) delete payload.id;
		// porcentajeAcciones es derivado (suma de acciones asignadas):
		// nunca se envía al servidor.
		delete payload.porcentajeAcciones;

		const url = esEdicion ? `${API_URL}/${accionistaEditando.id}` : API_URL;
		const method = esEdicion ? "PUT" : "POST";

		try {
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok) {
				return json.error || "Ocurrió un problema";
			}
			setMensaje(
				esEdicion
					? "Accionista actualizado correctamente"
					: "Accionista creado correctamente",
			);
			cerrarModal();
			cargarAccionistas();
			return null;
		} catch (err) {
			return `Error de conexión: ${err.message}`;
		}
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

	if (accionistaDetallando) {
		return (
			<AccionistaDetalle
				accionista={accionistaDetallando}
				onBack={() => setAccionistaDetallando(null)}
				onRefresh={cargarAccionistas}
			/>
		);
	}

	return (
		<div className="container">
			<div className="page-header">
				<h1>🏨 Administración de Accionistas</h1>
				<button className="btn btn-primary" onClick={abrirModalNuevo}>
					+ Agregar Accionista
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
				<h2>Listado de Accionistas</h2>
				{loading ? (
					<p className="text-muted">Cargando...</p>
				) : error ? (
					<div className="alert alert-error">{error}</div>
				) : accionistas.length === 0 ? (
					<p className="text-muted">No hay accionistas registrados.</p>
				) : (
					<>
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
												onClick={() => setAccionistaDetallando(a)}
											>
												Ver
											</button>
											<button
												className="btn btn-small"
												onClick={() => abrirModalEdicion(a)}
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
						<Pagination
							total={total}
							page={page}
							pageSize={pageSize}
							onPageChange={setPage}
							onPageSizeChange={(n) => {
								setPageSize(n);
								setPage(1);
							}}
						/>
					</>
				)}
			</section>

			<AccionistaModal
				open={modalAbierto}
				accionista={accionistaEditando}
				onClose={cerrarModal}
				onSave={guardarAccionista}
			/>
		</div>
	);
}
