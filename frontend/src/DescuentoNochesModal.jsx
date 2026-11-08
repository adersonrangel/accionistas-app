import { useState } from "react";

function fechaHoyLocal() {
	const ahora = new Date();
	return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 10);
}

/** Popup para registrar un descuento con cantidad y fecha efectiva. */
export default function DescuentoNochesModal({ onClose, onConfirm }) {
	const [cantidad, setCantidad] = useState("1");
	const [fecha, setFecha] = useState(fechaHoyLocal());
	const [guardando, setGuardando] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e) {
		e.preventDefault();
		setGuardando(true);
		setError("");
		const errorServidor = await onConfirm({ cantidad: Number(cantidad), fecha });
		if (errorServidor) {
			setError(errorServidor);
			setGuardando(false);
		}
	}

	return (
		<div
			className="modal-overlay"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget && !guardando) onClose();
			}}
		>
			<div
				className="modal card"
				role="dialog"
				aria-modal="true"
				aria-label="Descontar noches"
			>
				<h2>Descontar noches</h2>
				{error && <div className="alert alert-error" role="alert">{error}</div>}
				<form onSubmit={handleSubmit} className="form-grid">
					<div className="field">
						<label htmlFor="cantidad-descuento">Cantidad de noches</label>
						<input
							id="cantidad-descuento"
							type="number"
							min="1"
							step="1"
							required
							value={cantidad}
							onChange={(e) => setCantidad(e.target.value)}
						/>
					</div>
					<div className="field">
						<label htmlFor="fecha-descuento">Fecha de descuento</label>
						<input
							id="fecha-descuento"
							type="date"
							required
							value={fecha}
							onChange={(e) => setFecha(e.target.value)}
						/>
					</div>
					<div className="form-actions">
						<button type="submit" className="btn btn-primary" disabled={guardando}>
							{guardando ? "Descontando..." : "Confirmar descuento"}
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							onClick={onClose}
							disabled={guardando}
						>
							Cancelar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
