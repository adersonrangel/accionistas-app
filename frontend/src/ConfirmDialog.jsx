// Popup de confirmación para acciones destructivas,
// con el mismo lenguaje visual que el resto de modales del sistema.
export default function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = "Eliminar",
	onConfirm,
	onCancel,
}) {
	if (!open) return null;
	return (
		<div className="modal-overlay" onClick={onCancel}>
			<div
				className="modal card"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label={title}
			>
				<h2>{title}</h2>
				<p className="confirm-message">{message}</p>
				<div className="form-actions">
					<button type="button" className="btn btn-danger" onClick={onConfirm}>
						{confirmLabel}
					</button>
					<button type="button" className="btn btn-secondary" onClick={onCancel}>
						Cancelar
					</button>
				</div>
			</div>
		</div>
	);
}
