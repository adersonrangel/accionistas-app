import { useState } from "react";
import DescuentoNochesModal from "./DescuentoNochesModal";

const API_URL = "http://localhost:3001/api/consulta";

function safeGetItem(key) {
	try { return localStorage.getItem(key); } catch { return null; }
}

export default function ConsultaAccionista() {
	const [dni, setDni] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [resultado, setResultado] = useState(null);
	const [busquedaRealizada, setBusquedaRealizada] = useState(false);
	const [descuentoAbierto, setDescuentoAbierto] = useState(false);

	async function handleBuscar(e) {
		e.preventDefault();
		const dniLimpio = dni.trim();
		if (!dniLimpio) {
			setError("Ingresá una identificación para buscar");
			return;
		}

		setLoading(true);
		setError(null);
		setResultado(null);
		setBusquedaRealizada(true);

		try {
			const token = safeGetItem("app_token");
			const res = await fetch(`${API_URL}/accionista/dni/${encodeURIComponent(dniLimpio)}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const json = await res.json();

			if (!res.ok) {
				setError(json.error || "No se encontró el accionista");
				setResultado(null);
				return;
			}

			setResultado(json.data);
		} catch (err) {
			console.error(err);
			setError("No se pudo conectar con el servidor. Verificá que el backend esté corriendo.");
		} finally {
			setLoading(false);
		}
	}

	function handleNuevaBusqueda() {
		setResultado(null);
		setBusquedaRealizada(false);
		setDescuentoAbierto(false);
		setError(null);
		setDni("");
	}

	async function handleDescontar({ cantidad, fecha }) {
		try {
			const token = safeGetItem("app_token");
			const res = await fetch(
				`${API_URL}/accionista/dni/${encodeURIComponent(resultado.dni)}/descuento`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: JSON.stringify({ cantidad, fecha }),
				}
			);
			const json = await res.json();
			if (!res.ok) return json.error || "No se pudo registrar el descuento";

			setResultado(json.data);
			setDescuentoAbierto(false);
			return null;
		} catch (err) {
			console.error(err);
			return "No se pudo conectar con el servidor. Verificá que el backend esté corriendo.";
		}
	}

	return (
		<div className="consulta-container">
			<div className="page-header">
				<h1>🔍 Consulta de Accionista</h1>
			</div>

			{/* Formulario de búsqueda */}
			<section className="card consulta-search-card">
				<form onSubmit={handleBuscar} className="consulta-form">
					<div className="consulta-input-group">
						<label htmlFor="dni-busqueda" className="consulta-label">
							Buscar por identificación
						</label>
						<div className="consulta-input-row">
							<input
								id="dni-busqueda"
								type="text"
								className="consulta-input"
								placeholder="Ej: 30111222 o 12313231-6"
								value={dni}
								onChange={(e) => setDni(e.target.value)}
								disabled={loading}
								autoComplete="off"
							/>
							<button
								type="submit"
								className="btn btn-primary consulta-btn-buscar"
								disabled={loading}
							>
								{loading ? "Buscando..." : "Buscar"}
							</button>
						</div>
					</div>
				</form>
			</section>

			{/* Mensaje de error */}
			{error && (
				<div className="alert alert-error consulta-alert">
					<span className="consulta-alert-icon">⚠️</span>
					{error}
				</div>
			)}

			{/* Resultado: Card profesional del accionista */}
			{resultado && (
				<AccionistaCard
					accionista={resultado}
					onNuevaBusqueda={handleNuevaBusqueda}
					onDescontar={() => setDescuentoAbierto(true)}
				/>
			)}

			{/* Estado vacío antes de buscar */}
			{!busquedaRealizada && !resultado && (
				<div className="consulta-empty-state">
					<div className="consulta-empty-icon">👤</div>
					<p className="consulta-empty-text">
						Ingresá la identificación de un accionista para consultar su información
						y noches de beneficio disponibles.
					</p>
				</div>
			)}
			{descuentoAbierto && (
				<DescuentoNochesModal
					onClose={() => setDescuentoAbierto(false)}
					onConfirm={handleDescontar}
				/>
			)}
		</div>
	);
}

/**
 * Card profesional con la información del accionista y sus noches de beneficio.
 * Incluye indicador visual de noches disponibles y acciones futuras (módulos separados).
 */
function AccionistaCard({ accionista, onNuevaBusqueda, onDescontar }) {
	const { noches } = accionista;
	const porcentajeDisponible = noches.totales > 0
		? Math.round((noches.disponibles / noches.totales) * 100)
		: 0;

	// Determinar color del indicador según disponibilidad
	const getNivelDisponibilidad = () => {
		if (porcentajeDisponible >= 50) return "alto";
		if (porcentajeDisponible >= 20) return "medio";
		return "bajo";
	};

	const nivel = getNivelDisponibilidad();

	return (
		<div className="accionista-card">
			{/* Header con nombre e identificación */}
			<div className="accionista-card-header">
				<div className="accionista-card-avatar">
					{accionista.nombre.charAt(0)}{accionista.apellido.charAt(0)}
				</div>
				<div className="accionista-card-title">
					<h2 className="accionista-card-nombre">
						{accionista.nombre} {accionista.apellido}
					</h2>
					<span className="accionista-card-dni">Identificación: {accionista.dni}</span>
				</div>
				<span className="accionista-card-id">#{accionista.id}</span>
			</div>

			{/* Indicador de noches de beneficio */}
			<div className="accionista-card-noches">
				<div className="noches-indicador">
					<div className="noches-indicador-header">
						<span className="noches-indicador-label">Noches de beneficio</span>
						<span className={`noches-badge noches-badge-${nivel}`}>
							{porcentajeDisponible}% disponible
						</span>
					</div>

					{/* Número principal: noches disponibles */}
					<div className="noches-principal">
						<span className="noches-numero">{noches.disponibles}</span>
						<span className="noches-texto">de {noches.totales} noches disponibles</span>
					</div>

					{/* Barra de progreso */}
					<div className="noches-barra-container">
						<div
							className={`noches-barra noches-barra-${nivel}`}
							style={{ width: `${porcentajeDisponible}%` }}
							role="progressbar"
							aria-valuenow={noches.disponibles}
							aria-valuemin={0}
							aria-valuemax={noches.totales}
							aria-label={`${noches.disponibles} de ${noches.totales} noches disponibles`}
						/>
					</div>

					{/* Detalle de noches */}
					<div className="noches-detalle">
						<div className="noches-detalle-item">
							<span className="noches-detalle-valor">{noches.totales}</span>
							<span className="noches-detalle-label">Totales</span>
						</div>
						<div className="noches-detalle-item">
							<span className="noches-detalle-valor noches-usadas">{noches.usadas}</span>
							<span className="noches-detalle-label">Utilizadas</span>
						</div>
						<div className="noches-detalle-item">
							<span className="noches-detalle-valor noches-disponibles">{noches.disponibles}</span>
							<span className="noches-detalle-label">Disponibles</span>
						</div>
					</div>
				</div>
			</div>

			{/* Información adicional */}
			<div className="accionista-card-info">
				<div className="accionista-info-grid">
					<div className="accionista-info-item">
						<span className="accionista-info-label">📧 Email</span>
						<span className="accionista-info-valor">{accionista.email}</span>
					</div>
					{accionista.telefono && (
						<div className="accionista-info-item">
							<span className="accionista-info-label">📱 Teléfono</span>
							<span className="accionista-info-valor">{accionista.telefono}</span>
						</div>
					)}
					<div className="accionista-info-item">
						<span className="accionista-info-label">📊 Participación</span>
						<span className="accionista-info-valor">{accionista.porcentajeAcciones}%</span>
					</div>
					<div className="accionista-info-item">
						<span className="accionista-info-label">📅 Ingreso</span>
						<span className="accionista-info-valor">{accionista.fechaIngreso}</span>
					</div>
				</div>
			</div>

			{/* Acciones asignadas */}
			{accionista.acciones && accionista.acciones.length > 0 && (
				<div className="accionista-card-acciones">
					<h3 className="acciones-titulo">Acciones asignadas</h3>
					<div className="acciones-lista">
						{accionista.acciones.map((acc) => (
							<div key={acc.code} className="accion-chip">
								<span className="accion-code">{acc.code}</span>
								<span className="accion-detalle">
									{acc.percentage}% · {acc.nochesDeBeneficio} noches
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Acciones del módulo (futuros módulos separados) */}
			<div className="accionista-card-acciones-footer">
				<button
					className="btn btn-secondary"
					onClick={onNuevaBusqueda}
				>
					← Nueva búsqueda
				</button>
				<div className="acciones-modulos">
					{/* Placeholder para futuros módulos: Descontar noches, Historial, etc. */}
					<button
						className="btn btn-primary"
						onClick={onDescontar}
					>
						🌙 Descontar noches
					</button>
					<button
						className="btn btn-secondary"
						disabled
						title="Módulo en desarrollo"
					>
						📋 Ver historial
					</button>
				</div>
			</div>
		</div>
	);
}
