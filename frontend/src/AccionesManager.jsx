import { useState, useEffect } from "react";
import AccionModal from "./AccionModal.jsx";
import Pagination from "./Pagination.jsx";

const API_URL = "http://localhost:3001/api/acciones";
const LOGIN_URL = "http://localhost:3001/api/login";

export default function AccionesManager() {
  const [token, setToken] = useState(() => localStorage.getItem("acciones_token"));
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [iniciando, setIniciando] = useState(false);

  const [acciones, setAcciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionEditando, setAccionEditando] = useState(null);
  const [page, setPage] = useState(1);
const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [pageSize, setPageSize] = useState(10);

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

  function cerrarSesion() {
    localStorage.removeItem("acciones_token");
    setToken(null);
    setAcciones([]);
  }

  async function cargarAcciones() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`${API_URL}?${params}`, { headers: authHeaders });
      if (res.status === 401) {
        cerrarSesion();
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

  useEffect(() => {
    if (token) cargarAcciones();
  }, [token, page, pageSize]);

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
          cerrarSesion();
          return "Sesión expirada. Inicia sesión de nuevo.";
        }
        return json.error || "Ocurrió un problema";
      }
      setMensaje(esEdicion ? "Acción actualizada correctamente" : "Acción creada correctamente");
      cerrarModal();
      cargarAcciones();
      return null;
    } catch (err) {
      return `Error de conexión: ${err.message}`;
    }
  }

  async function eliminar(_id) {
    if (!confirm("¿Estás seguro de eliminar esta acción?")) return;
    try {
      const res = await fetch(`${API_URL}/${_id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json();
      if (res.status === 401) {
        cerrarSesion();
        return;
      }
      if (!res.ok) {
        throw new Error(json.error || "No se pudo eliminar");
      }
      setMensaje("Acción eliminada correctamente");
      cargarAcciones();
    } catch (err) {
      setMensaje(`Error de conexión al eliminar: ${err.message}`);
    }
  }

  if (!token) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: "400px", margin: "0 auto" }}>
          <h2>Iniciar Sesión</h2>
          <p className="text-muted">Acceso requerido para gestionar acciones.</p>
          {loginError && <div className="alert alert-error">{loginError}</div>}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="login-user">Usuario</label>
              <input
                id="login-user"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="login-pass">Contraseña</label>
              <input
                id="login-pass"
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
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>🏨 Administración de Acciones</h1>
        <div>
          <button className="btn btn-primary" onClick={abrirModalNuevo}>
            + Agregar Acción
          </button>
          <button className="btn btn-secondary" onClick={cerrarSesion}>
            Salir
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
                      onClick={() => eliminar(a._id)}
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
    </div>
  );
}