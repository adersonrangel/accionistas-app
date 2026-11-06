import { useState } from "react";
import AccionistasManager from "./AccionistasManager";
import AccionesManager from "./AccionesManager";

function App() {
  const [vista, setVista] = useState("accionistas");
  return (
    <div className="container">
      <nav style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          className={`btn ${vista === "accionistas" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setVista("accionistas")}
        >
          Accionistas
        </button>
        <button
          className={`btn ${vista === "acciones" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setVista("acciones")}
        >
          Acciones
        </button>
      </nav>
      {vista === "accionistas" ? <AccionistasManager /> : <AccionesManager />}
    </div>
  );
}

export default App;