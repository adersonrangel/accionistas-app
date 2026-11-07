# Feature: User Management & RBAC (login único + permisos)

Branch: `feat/user-management`. Baseline commit: `361e83e`.

## Specs

- **S1** (user verbatim): "Vamos a crear un módulo de administración de usuarios. donde este usuario, administrador con permisos para todo y usuario normal con permisos para el módulo de accionistas."
- **S2** (user verbatim): "el login que ya tenemos lo colocamos como entrada unica al sistemas"
- **S3** (user verbatim): "actualizamos los permisos en los modulos de accionistas y acciones."
- **S4** (resolved product decision via Ask, 2026-11-06): Roles are `admin` and `user` (normal).
  - **admin**: permisos para todo — CRUD accionistas, CRUD acciones, asignación de acciones, y administración de usuarios.
  - **user (normal)**: solo el módulo de accionistas (CRUD de accionistas). NO puede ver/usar el módulo de acciones ni asignaciones, ni administrar usuarios.
- **S5**: Login único de entrada. Al abrir la app, si no hay una sesión válida (token JWT), se muestra la pantalla de login. Tras loguear, el rol del usuario (del JWT) determina qué módulos/pestañas son visibles. Se añade opción de cerrar sesión (logout).

## Behavior / contract (source of truth for both writers)

### Roles
- `admin` → all modules.
- `user` → accionistas only (CRUD). No acciones, no asignación, no usuarios.

### Backend
- New Mongoose model `User`: `{ username (string, required, unique, lowercase), passwordHash (string, required), role (string, required, enum ["admin","user"], default "user") }`, `timestamps: true`. File: `backend/src/models/user.model.ts`.
- Password hashing: use Node built-in `crypto.scryptSync(password, salt, 64)` + random salt, stored as `salt:hash` hex. NO new npm deps (bcrypt is NOT a dependency). Verify with `crypto.timingSafeEqual`.
- Seed: on server start, if `User` collection is empty, create a default admin `{ username: "admin", password: "admin", role: "admin" }` (so the existing `admin`/`admin` keeps working). Mirror the existing `seedIfEmpty` pattern in `accionista.js`; call it from `server.js` after connect.
- Auth login (`backend/src/routes/auth.routes.ts`): `POST /login` validates `{username, password}` against the `User` collection (not the hardcoded constant). On success return `{ token, username, role }`. Token payload `{ username, role }`, same 24h expiry. On failure 401 `{ error: "Invalid credentials" }`. Missing fields → 400.
- New `GET /api/me` (authMiddleware): returns `{ username, role }` from `req.user`.
- New users routes (`backend/src/routes/users.routes.ts`), all guarded admin-only:
  - `GET /` → `{ data: [{id, username, role, createdAt}], total }` (never returns passwordHash).
  - `POST /` → body `{ username, password, role }`; validate username non-empty, password non-empty (min 4 chars), role in enum; unique username → 409 on duplicate. Return 201 `{ data: {id, username, role} }`.
  - `PUT /:id` → update `{ username?, password?, role? }`; 404 if missing. Return `{ data: {...} }`.
  - `DELETE /:id` → 404 if missing; prevent deleting the last admin (409) and prevent deleting oneself (409). Return `{ message }`.
- Mount in BOTH `backend/src/app.ts` and `backend/src/app.js` (app.js is the real server entry):
  - `app.use("/api/users", authMiddleware, adminOnly, usersRoutes)`.
  - Add `GET /api/me` via authRoutes (already mounted at `/api`).
- Permission guard updates (S3, S4) in BOTH `app.ts` and `app.js`:
  - `/api/accionistas` → add `authMiddleware` (any authenticated role). Keep existing sub-routes.
  - `/api/acciones` → add `adminOnly` at mount (module fully admin-only now, incl. GET list).
  - `/api/accionistas/:id/acciones` → already `authMiddleware + adminOnly`; keep.
  - NOTE: accionistas.js currently imports only the model; guard is added at mount in app files (do NOT add per-route guards there).
- Do NOT change accionistas CRUD behavior for an authenticated user (CRUD stays open to both roles).

### Frontend
- Central login: new `frontend/src/Login.jsx`. App-level gate in `frontend/src/App.jsx`:
  - On load, read session from `localStorage`: `app_token` (JWT string) and `app_user` (JSON `{username, role}`).
  - If no `app_token` → render `<Login />` only.
  - `<Login />` posts to `http://localhost:3001/api/login` with `{username, password}`; on success store `token` and `{username, role}` under `app_token` / `app_user`; call a `setUser`/`onLogin` to re-render app.
  - Backwards-compat: if no `app_token` but legacy `acciones_token` exists, treat it as the token and fetch role via `GET /api/me` to populate `app_user`; if that fails, clear and show login.
- Role-based nav in `App.jsx`:
  - "Accionistas" button: always (both roles).
  - "Acciones" button: only if `role === "admin"`.
  - "Usuarios" button: only if `role === "admin"` → renders new `<UsersManager />`.
  - Add a header showing current `username` (+ role badge) and a "Cerrar sesión" (logout) button that clears `app_token`/`app_user` and re-renders to login.
- New `frontend/src/UsersManager.jsx`: admin CRUD for users (table list; create/edit modal with username, password, role select admin|user; delete with confirm). Uses Bearer `app_token`. Mirror the existing modal/pagination/styling patterns from `AccionistasManager.jsx`.
- Strip embedded logins: remove the login form + `acciones_token` logic from `AccionistaDetalle.jsx` (TabAcciones) and `AccionesManager.jsx`; they now rely on the app-level session. All `fetch` calls to `/api/*` must send `Authorization: Bearer <app_token>`. `AccionistasManager.jsx` currently sends NO auth header — add it (backend now requires it).
- `AccionistaDetalle.jsx` (TabAcciones): the share-assignment UI is admin-only; for `role === "user"` hide the "Acciones" tab entirely (they only see shareholder info). For admin, keep it but drive its fetches from the app-level `app_token`.
- Keep UI copy in the existing language (Spanish) consistent with current components; new users module copy in Spanish to match.

### API base
- Keep `http://localhost:3001` as base (matches existing `AccionistasManager`/`AccionesManager`).

## Tasks
- T1 — backend — User model + default-admin seed. Route: `backend/src/models/user.model.ts`, `backend/src/server.js`. (S1,S4,S5)
- T2 — backend — DB-backed login + `GET /api/me`. Route: `backend/src/routes/auth.routes.ts`. (S2,S5)
- T3 — backend — users CRUD routes (admin-only). Route: `backend/src/routes/users.routes.ts`. (S1)
- T4 — backend — mount users + update guards in `app.ts` AND `app.js` (accionistas +auth; acciones +adminOnly). Route: `backend/src/app.ts`, `backend/src/app.js`. (S3,S4)
- T5 — backend — tests: login (valid/invalid/missing), /api/me, users CRUD (admin ok, non-admin 403), guards (accionistas 401 w/o token, acciones GET 403 for non-admin, 200 for admin). Route: `backend/test/`. (all)
- T6 — frontend — central `Login.jsx` + App-level gate + role-based nav + logout. Route: `frontend/src/App.jsx`, `frontend/src/Login.jsx`. (S2,S5)
- T7 — frontend — `UsersManager.jsx` (admin CRUD). Route: `frontend/src/UsersManager.jsx`. (S1)
- T8 — frontend — strip embedded logins, add Bearer header to all fetches, hide Acciones tab for non-admin. Route: `frontend/src/AccionistasManager.jsx`, `AccionistaDetalle.jsx`, `AccionesManager.jsx`. (S2,S3,S4)
- T9 — frontend — tests: login flow, role-gated nav (acciones/usuarios hidden for user), users manager CRUD render, accionista detail hides Acciones tab for user. Route: `frontend/src/__tests__/`. (all)

## Commit plan (work-unit slices, ~≤400 authored lines each)
- C1: T1+T2 (user model, seed, DB login, /me) — backend.
- C2: T3+T4 (users routes + mount + guard updates) — backend.
- C3: T5 (backend tests).
- C4: T6 (frontend login + gate + nav + logout).
- C5: T7+T8 (UsersManager + strip embedded logins + auth headers + tab gating).
- C6: T9 (frontend tests).
Each slice: behavior + tests + this doc updated together where applicable.

## Log
- **L1** (user verbatim, 2026-11-06): "Actualmente para ingresar al modulo de accionistas tenemos un login. Vamos a crear un modulo de administracion de usuarios. donde este usuario, administrador con permisos para todo y usuario normal con permisos para el modulo de accionistas. el login que ya tenemos lo colocamos como entrada unica al sistemas y actualizamos los permisos en los modulos de accionistas y acciones."
- **L2** (decision, 2026-11-06, Ask): user chose "Accionistas CRUD + acciones admin-only" → normal user = accionistas CRUD only; acciones (CRUD + asignación) = admin-only; admin = everything.
- **L3** (constraint, 2026-11-06): no `bcrypt` in deps → use Node built-in `crypto.scryptSync` for password hashing to avoid a new dependency. `jsonwebtoken` already present. Real server entry is `backend/src/app.js` (mirror changes in `app.ts`).