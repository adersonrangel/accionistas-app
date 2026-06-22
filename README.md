# 🏨 Administración de Accionistas — Hotel

Prototipo rápido de sistema para gestionar los accionistas de un hotel.

## Stack

- **Backend:** Node.js + Express + CORS (datos en memoria para prototipo)
- **Frontend:** React + Vite

## Funcionalidades

- CRUD completo de accionistas
- Campos: nombre, apellido, DNI, email, porcentaje de acciones, fecha de ingreso, teléfono, dirección
- Validación básica de campos requeridos
- UI responsive con grid y tabla

## Estructura

```
proyecto-bu/
├── backend/
│   ├── src/
│   │   ├── models/accionista.js      # Datos en memoria + funciones CRUD
│   │   ├── routes/accionistas.js   # API REST
│   │   └── server.js               # Entry point Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── AccionistasManager.jsx  # Componente principal con UI completa
│   │   ├── App.jsx
│   │   └── index.css               # Estilos
│   ├── index.html
│   └── package.json
├── openspec/config.yaml
└── .atl/skill-registry.md
```

## Ejecución

### 1. Backend

```bash
cd backend
npm install
npm start
```

Levanta en `http://localhost:3001`

Endpoints:
- `GET /health` — health check
- `GET /api/accionistas` — listar
- `GET /api/accionistas/:id` — obtener uno
- `POST /api/accionistas` — crear
- `PUT /api/accionistas/:id` — actualizar
- `DELETE /api/accionistas/:id` — eliminar

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

> Nota: El backend debe estar corriendo para que el frontend pueda consumir la API.

## Datos iniciales

Al levantar el backend se cargan 3 accionistas de ejemplo:
- Juan Pérez (25.5%)
- María González (15%)
- Carlos Rodríguez (10%)

## Próximos pasos

- Agregar base de datos (PostgreSQL / SQLite / MongoDB)
- Autenticación y roles (admin, accionista)
- Paginación y búsqueda en el listado
- Exportar reportes (PDF / Excel)
- Tests automatizados
