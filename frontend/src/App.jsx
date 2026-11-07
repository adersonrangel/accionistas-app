import { useState, useEffect } from "react";
import AccionistasManager from "./AccionistasManager";
import AccionesManager from "./AccionesManager";
import UsersManager from "./UsersManager";
import Login from "./Login";

const API_URL = "http://localhost:3001/api";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [vista, setVista] = useState("accionistas");

  // On mount: read session from localStorage.
  useEffect(() => {
    const storedToken = localStorage.getItem("app_token");
    const storedUser = localStorage.getItem("app_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("app_token");
        localStorage.removeItem("app_user");
      }
    } else if (storedToken) {
      // token without user: try to recover user via /api/me
      recoverSession(storedToken);
    } else if (localStorage.getItem("acciones_token")) {
      // Legacy backwards-compat: try to recover session using the old token.
      recoverFromLegacyToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function recoverSession(storedToken) {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No autorizado");
      const sessionUser = { username: json.username, role: json.role };
      localStorage.setItem("app_token", storedToken);
      localStorage.setItem("app_user", JSON.stringify(sessionUser));
      setToken(storedToken);
      setUser(sessionUser);
    } catch {
      localStorage.removeItem("app_token");
      localStorage.removeItem("app_user");
    }
  }

  async function recoverFromLegacyToken() {
    const legacyToken = localStorage.getItem("acciones_token");
    if (!legacyToken) return;

    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${legacyToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No autorizado");
      const sessionUser = { username: json.username, role: json.role };
      localStorage.setItem("app_token", legacyToken);
      localStorage.setItem("app_user", JSON.stringify(sessionUser));
      localStorage.removeItem("acciones_token");
      setToken(legacyToken);
      setUser(sessionUser);
    } catch {
      localStorage.removeItem("acciones_token");
    }
  }

  function handleLogin(json) {
    const sessionUser = { username: json.username, role: json.role };
    localStorage.setItem("app_token", json.token);
    localStorage.setItem("app_user", JSON.stringify(sessionUser));
    setToken(json.token);
    setUser(sessionUser);
  }

  function handleLogout() {
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user");
    setToken(null);
    setUser(null);
    setVista("accionistas");
  }

  // If role changes and the current vista is not allowed, fall back to accionistas.
  useEffect(() => {
    if (!user) return;
    const allowed = ["accionistas"];
    if (user.role === "admin") {
      allowed.push("acciones", "users");
    }
    if (!allowed.includes(vista)) {
      setVista("accionistas");
    }
  }, [user, vista]);

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  const showAcciones = user.role === "admin";
  const showUsers = user.role === "admin";

  return (
    <div className="container">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
          padding: "12px 0",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <nav style={{ display: "flex", gap: "10px" }}>
          <button
            className={`btn ${vista === "accionistas" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setVista("accionistas")}
          >
            Accionistas
          </button>
          {showAcciones && (
            <button
              className={`btn ${vista === "acciones" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setVista("acciones")}
            >
              Acciones
            </button>
          )}
          {showUsers && (
            <button
              className={`btn ${vista === "users" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setVista("users")}
            >
              Usuarios
            </button>
          )}
        </nav>
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <span className="text-muted">
            {user.username}
            <span
              className={`badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`}
              style={{ marginLeft: "6px" }}
            >
              {user.role === "admin" ? "Administrador" : "Normal"}
            </span>
          </span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {vista === "accionistas" && <AccionistasManager />}
      {vista === "acciones" && <AccionesManager />}
      {vista === "users" && <UsersManager />}
    </div>
  );
}

export default App;