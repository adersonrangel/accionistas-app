import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api/users";

function safeGetItem(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export default function UsersManager() {
  const appToken = safeGetItem("app_token");
  const authHeaders = appToken ? { Authorization: `Bearer ${appToken}` } : {};
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Form state
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formError, setFormError] = useState("");

  async function cargarUsuarios() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { headers: authHeaders });
      if (res.status === 401) {
        localStorage.removeItem("app_token");
        localStorage.removeItem("app_user");
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error("Error cargando usuarios");
      const json = await res.json();
      setUsuarios(json.data || []);
    } catch (_err) {
      setError("No se pudo conectar con el backend. ¿Está corriendo en el puerto 3001?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (appToken) cargarUsuarios();
  }, []);

  function abrirModalNuevo() {
    setUsuarioEditando(null);
    setFormUsername("");
    setFormPassword("");
    setFormRole("user");
    setFormError("");
    setModalAbierto(true);
  }

  function abrirModalEdicion(usuario) {
    setUsuarioEditando(usuario);
    setFormUsername(usuario.username);
    setFormPassword("");
    setFormRole(usuario.role);
    setFormError("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setUsuarioEditando(null);
    setFormError("");
  }

  async function guardarUsuario(e) {
    e.preventDefault();
    const esEdicion = !!usuarioEditando;
    const payload = { username: formUsername, role: formRole };
    if (formPassword) payload.password = formPassword;

    const url = esEdicion ? `${API_URL}/${usuarioEditando.id}` : API_URL;
    const method = esEdicion ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Ocurrió un problema");
        return;
      }
      setMensaje(esEdicion ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
      cerrarModal();
      cargarUsuarios();
    } catch (err) {
      setFormError(`Error de conexión: ${err.message}`);
    }
  }

  async function eliminarUsuario(usuario) {
    if (!confirm(`¿Estás seguro de eliminar a ${usuario.username}?`)) return;
    try {
      const res = await fetch(`${API_URL}/${usuario.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) {
        setMensaje(`Error: ${json.error || "No se pudo eliminar"}`);
        return;
      }
      setMensaje("Usuario eliminado correctamente");
      cargarUsuarios();
    } catch (err) {
      setMensaje(`Error de conexión: ${err.message}`);
    }
  }

  return (
    <div className="container">
      {mensaje && (
        <div
          className={`alert ${mensaje.startsWith("Error") ? "alert-error" : "alert-success"}`}
        >
          {mensaje}
        </div>
      )}

      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2>Usuarios</h2>
          <button className="btn btn-primary" onClick={abrirModalNuevo}>
            + Nuevo Usuario
          </button>
        </div>

        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : usuarios.length === 0 ? (
          <p className="text-muted">No hay usuarios registrados.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>
                    <span
                      className={`badge ${u.role === "admin" ? "badge-admin" : "badge-user"}`}
                    >
                      {u.role === "admin" ? "Administrador" : "Normal"}
                    </span>
                  </td>
                  <td>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <button className="btn btn-small" onClick={() => abrirModalEdicion(u)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => eliminarUsuario(u)}
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

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2>{usuarioEditando ? "Editar Usuario" : "Nuevo Usuario"}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={guardarUsuario} className="form-grid">
              <div className="field">
                <label htmlFor="user-username">Usuario</label>
                <input
                  id="user-username"
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <div className="field">
                <label htmlFor="user-password">
                  Contraseña{usuarioEditando ? " (dejar vacío para no cambiar)" : ""}
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  minLength={usuarioEditando ? 0 : 4}
                  required={!usuarioEditando}
                />
              </div>
              <div className="field">
                <label htmlFor="user-role">Rol</label>
                <select
                  id="user-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="user">Normal</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {usuarioEditando ? "Guardar" : "Crear"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}