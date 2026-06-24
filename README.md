# 🏨 Administración de Accionistas — Hotel

Sistema para gestionar los accionistas de un hotel con soporte para múltiples acciones (shares) por accionista.

## Stack

- **Backend:** Node.js + Express + TypeScript + Mongoose (MongoDB)
- **Frontend:** React + Vite + JavaScript
- **Tests:** Jest + Supertest (integración)

## Funcionalidades

- CRUD completo de accionistas
- Gestión de acciones (shares) por accionista: creación, listado, transferencia
- Cada acción tiene: número único, porcentaje, fecha de adquisición
- Validación de porcentaje total (0-100%)
- Migración de datos legacy (`porcentajeAcciones` → array de `Share` objects)
- API REST versionada (`/api/v1`)
- UI responsive con tabla y formularios

## Estructura

```
.
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── accionista.js        # Modelo legacy (memoria)
│   │   │   ├── share.model.ts       # Modelo Share (Mongoose)
│   │   │   ├── shareholder.model.ts # Modelo Shareholder (Mongoose)
│   │   │   └── share.model.js       # Modelo Share (JS, legacy wrapper)
│   │   ├── routes/
│   │   │   └── accionistas.js       # API REST v1
│   │   ├── server.js                # Entry point Express + DB connection
│   │   └── migrations/
│   │       └── migrateLegacyShares.ts # Migración legacy → shares
│   ├── test/
│   │   └── integration/
│   │       └── shareholderShares.endpoints.test.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── AccionistasManager.jsx   # Componente principal
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── openspec/
│   ├── config.yaml
│   ├── changes/
│   │   └── shareholder-multi-shares/  # SDD artifacts
│   └── specs/
│       └── Shareholder/
│           └── spec.md
├── .atl/skill-registry.md
└── PR3_TESTS_MIGRATION.md
```

## Ejecución

### Requisitos previos

- Node.js 18+
- MongoDB corriendo localmente (`mongodb://localhost:27017`)
- pnpm (recomendado) o npm

### 1. Backend

```bash
cd backend
pnpm install   # o npm install
pnpm dev       # desarrollo con tsx watch
# o
pnpm build && pnpm start  # producción
```

Levanta en `http://localhost:3001`

Endpoints principales (`/api/v1/accionistas`):
- `GET /health` — health check
- `GET /accionistas` — listar (con `shares` populado)
- `GET /accionistas/:id` — obtener uno
- `POST /accionistas` — crear
- `PUT /accionistas/:id` — actualizar
- `DELETE /accionistas/:id` — eliminar
- `GET /accionistas/:id/shares` — listar acciones del accionista
- `POST /accionistas/:id/shares` — crear acción
- `POST /accionistas/:id/shares/transfer` — transferir acción entre accionistas

### 2. Frontend

En otra terminal:

```bash
cd frontend
pnpm install   # o npm install
pnpm run dev
```

Abre `http://localhost:5173` en el navegador.

> Nota: El backend debe estar corriendo para que el frontend pueda consumir la API.

## Tests

```bash
cd backend
pnpm test        # ejecuta tests unitarios e integración
pnpm test:watch  # modo watch
```

## Migración de datos legacy

Si tienes datos con el campo `porcentajeAcciones` (número simple), ejecuta la migración para convertirlos a objetos `Share`:

```bash
cd backend
pnpm run migrate
```

Esto crea un documento `Share` por cada accionista legacy, preservando el porcentaje y fecha de ingreso.

## Datos iniciales

Al levantar el backend por primera vez (con base de datos vacía), se cargan 3 accionistas de ejemplo:
- Juan Pérez (25.5%)
- María González (15%)
- Carlos Rodríguez (10%)

## Próximos pasos

- Autenticación y roles (admin, accionista)
- Paginación y búsqueda en el listado
- Exportar reportes (PDF / Excel)
- Frontend: migración a TypeScript y componentes de shares
- Documentación OpenAPI/Swagger