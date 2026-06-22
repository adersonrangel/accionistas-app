import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/api/accionistas";

export default function AccionistasManager() {
  const [accionistas, setAccionistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    id: null,
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    porcentajeAcciones: "",
    fechaIngreso: "",
    telefono: "",
    direccion: ""
  });
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function cargarAccionistas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setAccionistas(json.data || []);
    } catch (e) {
      setError("No se pudo conectar con el backend. ¿Está corriendo en el puerto 3001?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarAccionistas();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setForm({
      id: null,
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      porcentajeAcciones: "",
      fechaIngreso: "",
      telefono: "",
      direccion: ""
    });
    setEditando(false);
  }

  function fillFormEdit(acc) {
    setForm({ ...acc });
    setEditando(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("");
    const payload = { ...form };
    if (!editando) delete payload.id;

    try {
      const url = editando ? `${API_URL}/${form.id}` : API_URL;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        setMensaje(`Error: ${json.error || "Ocurrió un problema"}`);
        return;
      }
      setMensaje(editando ? "Accionista actualizado correctamente" : "Accionista creado correctamente");
      resetForm();
      cargarAccionistas();
    } catch (e) {
      setMensaje("Error de conexión con el servidor.");
    }
  }

  async function eliminar(id) {
    if (!confirm("¿Estás seguro de eliminar este accionista?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setMensaje(`Error: ${json.error || "No se pudo eliminar"}`);
        return;
      }
      setMensaje("Accionista eliminado correctamente");
      cargarAccionistas();
    } catch (e) {
      setMensaje("Error de conexión al eliminar.");
    }
  }

  return (
    <div className="container">
      <h1>🏨 Administración de Accionistas</h1>

      {mensaje && (
        <div className={`alert ${mensaje.startsWith("Error") ? "alert-error" : "alert-success"}`}>
          {mensaje}
        </div>
      )}

      <section className="card">
        <h2>{editando ? "Editar Accionista" : "Nuevo Accionista"}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label>Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Apellido</label>
            <input name="apellido" value={form.apellido} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>DNI</label>
            <input name="dni" value={form.dni} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>% Acciones</label>
            <input type="number" step="0.01" name="porcentajeAcciones" value={form.porcentajeAcciones} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Fecha de Ingreso</label>
            <input type="date" name="fechaIngreso" value={form.fechaIngreso} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editando ? "Guardar Cambios" : "Crear Accionista"}
            </button>
            {editando && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Listado de Accionistas</h2>
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : accionistas.length === 0 ? (
          <p className="text-muted">No hay accionistas registrados.</p>
        ) : (
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
              {accionistas.map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.nombre}</td>
                  <td>{a.apellido}</td>
                  <td>{a.dni}</td>
                  <td>{a.email}</td>
                  <td>{a.porcentajeAcciones}%</td>
                  <td>{a.fechaIngreso}</td>
                  <td>
                    <button className="btn btn-small" onClick={() => fillFormEdit(a)}>
                      Editar
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => eliminar(a.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
