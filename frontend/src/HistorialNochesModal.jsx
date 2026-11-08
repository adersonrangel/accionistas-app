function formatearFecha(fecha) {
	if (!fecha) return "";
	const [anio, mes, dia] = fecha.slice(0, 10).split("-");
	return `${dia}/${mes}/${anio}`;
}

/** Muestra los descuentos y devoluciones con su fecha efectiva. */
export default function HistorialNochesModal({ movimientos, cargando, error, onClose }) {
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
				aria-label="Historial de noches"
			>
				<h2>Historial de noches</h2>
				{cargando && <p>Cargando historial...</p>}
				{error && <div className="alert alert-error" role="alert">{error}</div>}
				{!cargando && !error && movimientos.length === 0 && (
					<p>No hay movimientos registrados.</p>
				)}
				{!cargando && !error && movimientos.length > 0 && (
					<table className="table">
						<thead>
							<tr>
								<th>Fecha</th>
								<th>Tipo</th>
								<th>Noches</th>
								<th>Motivo</th>
								<th>Usuario</th>
							</tr>
						</thead>
						<tbody>
							{movimientos.map((mov) => (
								<tr key={mov.id}>
									<td>{formatearFecha(mov.fecha)}</td>
									<td>{mov.tipo === "devolucion" ? "Devolución" : "Descuento"}</td>
									<td>{mov.cantidad}</td>
									<td>{mov.motivo || "—"}</td>
									<td>{mov.usuario || "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				<div className="form-actions">
					<button type="button" className="btn btn-secondary" onClick={onClose}>
						Cerrar
					</button>
				</div>
			</div>
		</div>
	);
}
