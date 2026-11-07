import Login from "./Login";
import "./Landing.css";

function BrandMark({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="10" width="14" height="3" rx="1" fill="#D9B25C" />
        <rect x="5" y="5.5" width="10" height="3" rx="1" fill="currentColor" />
        <rect x="7" y="1" width="6" height="3" rx="1" fill="#D9B25C" />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <span className="lg-check" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 6.2 4.8 9 10 3.4"
          stroke="#D9B25C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const MODULES = [
  {
    title: "Accionistas",
    body: "Alta, consulta y baja de accionistas. Toda la información de cada socio en una sola ficha, siempre actualizada.",
    detail: "Disponible para admin y usuario",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="7.5" r="3.6" stroke="#D9B25C" strokeWidth="1.8" />
        <path
          d="M3.5 18.5c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5"
          stroke="#D9B25C"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Acciones",
    body: "Cada acción registra número único, porcentaje y fecha de adquisición. Asignación y transferencias con control total.",
    detail: "Exclusivo de admin",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M11 2.5A8.5 8.5 0 1 0 19.5 11H11V2.5Z"
          stroke="#D9B25C"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12.8 5.6A6 6 0 0 1 16.4 9.2h-3.6V5.6Z" fill="#D9B25C" />
      </svg>
    ),
  },
  {
    title: "Seguridad",
    body: "Login único al sistema con sesión protegida. El rol del usuario — admin o usuario — define qué módulos puede ver.",
    detail: "Roles admin y usuario",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M11 2.2 4 5v5.4c0 4.4 3 7.7 7 9.4 4-1.7 7-5 7-9.4V5l-7-2.8Z"
          stroke="#D9B25C"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8 11l2.2 2.2L14.4 9"
          stroke="#D9B25C"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Landing({ onLogin }) {
  return (
    <div className="lg-root">
      <header className="lg-header">
        <div className="lg-container lg-header-inner">
          <a className="lg-brand" href="#inicio" aria-label="Accionistas Hotel — inicio">
            <BrandMark className="lg-brand-mark lg-on-white" />
            <span className="lg-brand-name">
              Accionistas <span>· Hotel</span>
            </span>
          </a>
          <nav className="lg-nav" aria-label="Navegación principal">
            <a className="lg-nav-link" href="#modulos">
              Módulos
            </a>
            <a className="lg-nav-link" href="#seguridad">
              Seguridad
            </a>
            <a className="lg-btn-header" href="#login">
              Iniciar sesión
            </a>
          </nav>
        </div>
      </header>

      <main id="inicio">
        {/* Hero + login */}
        <section className="lg-hero" aria-labelledby="lg-hero-title">
          <div className="lg-container lg-hero-grid">
            <div>
              <p className="lg-eyebrow">Plataforma de gestión hotelera</p>
              <h1 id="lg-hero-title">
                Toda la propiedad de tu hotel, en un solo lugar
              </h1>
              <p className="lg-lead">
                Gestión de accionistas, acciones y permisos de acceso desde un único
                sistema: sin hojas de cálculo, sin datos dispersos, sin versiones que
                no coinciden.
              </p>

              <ul className="lg-bullets">
                <li>
                  <CheckIcon />
                  Fichas completas de cada accionista con su historial de acciones
                </li>
                <li>
                  <CheckIcon />
                  Acciones con número único, porcentaje y fecha de adquisición
                </li>
                <li>
                  <CheckIcon />
                  Login único con roles: admin y usuario, cada uno con lo que necesita
                </li>
              </ul>

              <div className="lg-cta-row">
                <a className="lg-btn-primary" href="#login">
                  Comenzar ahora
                </a>
                <a className="lg-btn-ghost" href="#modulos">
                  Ver módulos
                </a>
              </div>

              <div className="lg-trust-row" aria-label="Características de la plataforma">
                <span className="lg-chip">Acceso con roles</span>
                <span className="lg-chip">Sin hojas de cálculo</span>
                <span className="lg-chip">Datos centralizados</span>
              </div>
            </div>

            <div className="lg-login-card" id="login">
              <div className="lg-login-head">
                <BrandMark className="lg-brand-mark lg-on-dark" />
                <h2>Iniciar Sesión</h2>
              </div>
              <p className="lg-login-sub">
                Acceso único al sistema. Su rol define los módulos disponibles.
              </p>

              <Login bare onLogin={onLogin} />

              <p className="lg-login-hint">
                <strong>¿Es su primer acceso?</strong>
                <br />
                Solicite credenciales al administrador del hotel.
              </p>
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section className="lg-modules" id="modulos" aria-labelledby="lg-modules-title">
          <div className="lg-container">
            <div className="lg-section-head">
              <p className="lg-kicker">Módulos del sistema</p>
              <h2 id="lg-modules-title">
                Todo lo que gestiona el hotel, organizado
              </h2>
              <p>
                Cada módulo está separado por responsabilidad y protegido por su rol.
                Lo que necesita lo ve de inmediato; lo demás, no.
              </p>
            </div>

            <div className="lg-module-grid">
              {MODULES.map((mod) => (
                <article
                  className="lg-module-card"
                  id={mod.title === "Seguridad" ? "seguridad" : undefined}
                  key={mod.title}
                >
                  <span className="lg-module-icon">{mod.icon}</span>
                  <h3>{mod.title}</h3>
                  <p>{mod.body}</p>
                  <p className="lg-module-detail">{mod.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="lg-footer">
        <div className="lg-container lg-footer-inner">
          <p>© 2026 Accionistas · Hotel — Sistema interno de gestión de accionistas</p>
          <p className="lg-footer-tech">
            <span>API REST /api/v1</span>
            <span>React</span>
            <span>Node.js</span>
            <span>MongoDB</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
