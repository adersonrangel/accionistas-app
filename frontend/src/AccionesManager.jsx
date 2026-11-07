import { useState, useEffect } from "react";
import AccionModal from "./AccionModal.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Pagination from "./Pagination.jsx";

const API_URL = "http://localhost:3001/api/acciones";

function safeGetItem(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export default function AccionesManager() {
  const appToken = safeGetItem("app_token");
  const authHeaders = appToken ? { Authorization: `Bearer ${appToken}` } : {};
  const [acciones, setAcciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPorcentaje, setTotalPorcentaje] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionEditando, setAccionEditando] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function cargarAcciones() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`${API_URL}?${params}`, { headers: authHeaders });
      if (res.status === 401) {
        localStorage.removeItem("app_token");
        localStorage.removeItem("app_user");
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error("Error cargando acciones");
      const json = await res.json();
      setAcciones(json.data || []);
      setTotal(json.total || json.data.length);
    } catch (_err) {
      setError(`No se pudo conectar con el backend. ¿Está corriendo en el puerto 3001?`);
    } finally {
      setLoading(false);
    }
  }

  async function cargarTotalPorcentaje() {
    try {
      const res = await fetch(`${API_URL}/total`, { headers: authHeaders });
      if (res.status === 401) {
        localStorage.removeItem("app_token");
        localStorage.removeItem("app_user");
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error("Error cargando el total de porcentajes");
      const json = await res.json();
      setTotalPorcentaje(json.data?.totalPercentage ?? 0);
    } catch (_err) {
      setError(`No se pudo conectar con el backend. ¿Está corriendo en el puerto 3001?`);
    }
  }

  useEffect(() => {
    if (appToken) {
      cargarAcciones();
      cargarTotalPorcentaje();
    }
  }, [page, pageSize]);

  function abrirModalNuevo() {
    setAccionEditando(null);
    setModalAbierto(true);
  }

  function abrirModalEdicion(accion) {
    setAccionEditando(accion);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setAccionEditando(null);
  }

  async function guardarAccion(values, esEdicion) {
    const payload = { ...values };
    if (!esEdicion) delete payload.id;

    const url = esEdicion ? `${API_URL}/${accionEditando._id}` : API_URL;
    const method = esEdicion ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("app_token");
          localStorage.removeItem("app_user");
          window.location.reload();
          return "Sesión expirada. Inicia sesión de nuevo.";
        }
        return json.error || "Ocurrió un problema";
      }
      setMensaje(esEdicion ? "Acción actualizada correctamente" : "Acción creada correctamente");
      cerrarModal();
      cargarAcciones();
      cargarTotalPorcentaje();
      return null;
    } catch (err) {
      return `Error de conexión: ${err.message}`;
    }
  }

  function solicitarEliminar(_id) {
    setEliminandoId(_id);
  }

  async function confirmarEliminar() {
    const _id = eliminandoId;
    setEliminandoId(null);
    try {
      const res = await fetch(`${API_URL}/${_id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json();
      if (res.status === 401) {
        localStorage.removeItem("app_token");
        localStorage.removeItem("app_user");
        window.location.reload();
        return;
      }
      if (!res.ok) {
        throw new Error(json.error || "No se pudo eliminar");
      }
      setMensaje("Acción eliminada correctamente");
      cargarAcciones();
      cargarTotalPorcentaje();
    } catch (err) {
      setMensaje(`Error de conexión al eliminar: ${err.message}`);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>🏨 Administración de Acciones</h1>
        <div>
          <button className="btn btn-primary" onClick={abrirModalNuevo}>
            + Agregar Acción
          </button>
        </div>
      </div>

      {mensaje && (
        <div
          className={`alert ${mensaje.startsWith("Error") ? "alert-error" : "alert-success"}`}
        >
          {mensaje}
        </div>
      )}

      <section className="card">
        <h2>Total de Porcentajes</h2>
        <p className="total-porcentaje" data-testid="total-porcentaje">
          {totalPorcentaje.toLocaleString("es-AR", { maximumFractionDigits: 2 })} %
        </p>
      </section>

      <section className="card">
        <h2>Acciones registradas</h2>
        <p className="total-porcentaje" data-testid="total-acciones">
          {total}
        </p>
      </section>

      <section className="card">
        <h2>Listado de Acciones</h2>
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : acciones.length === 0 ? (
          <p className="text-muted">No hay acciones registradas.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Porcentaje</th>
                <th>Noches de beneficio</th>
                <th>ID (GUID)</th>
                <th>Accionista</th>
                <th>Creación</th>
                <th>Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {acciones.map((a) => (
                <tr key={a._id}>
                  <td>{a.code}</td>
                  <td>{a.percentage != null ? `${a.percentage} %` : "—"}</td>
                  <td>{a.nochesDeBeneficio != null ? a.nochesDeBeneficio : "—"}</td>
                  <td>{a._id ? a._id.substring(0, 8) + "..." : ""}</td>
                  <td>{a.shareholderId || "—"}</td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</td>
                  <td>{a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "—"}</td>
                  <td>
                    <button
                      className="btn btn-small"
                      onClick={() => abrirModalEdicion(a)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => solicitarEliminar(a._id)}
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

      <AccionModal
        open={modalAbierto}
        accion={accionEditando}
        onClose={cerrarModal}
        onSave={guardarAccion}
      />

      <ConfirmDialog
        open={eliminandoId !== null}
        title="Eliminar acción"
        message="¿Estás seguro de eliminar esta acción?"
        onConfirm={confirmarEliminar}
        onCancel={() => setEliminandoId(null)}
      />
    </div>
  );
}