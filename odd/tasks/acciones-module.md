# Acciones Module (standalone)

Reshape the currently UNUSED `Share` module into a standalone "acciones" resource.
Confirmed decisions: scope = backend + frontend; drop `percentage`/`acquisitionDate`;
acciones live apart (not nested under shareholder); adjudication to a shareholder = phase 2.

## Specs
S1. Each accion has an auto-generated **GUID** identifier created at insert time. [user: "un identificador tipo GUID que se creara en el momento de insertarlo en la BD"]. Implementation: `_id` = UUID v4 string, generated at insert (crypto.randomUUID), immutable.
S2. Each accion has a **5-character string code**, zero-padded sequential: `00001`, `00002`, `00003`, `00010`, ... [user: "un identificador tipo string, con 5 caracteres de longitud ... 00001, 00002, 00003, 00010 como ejemplos"].
S3. On create, `code` is auto-generated as the next sequential value (client does not supply it). [derived from S2 sequence]
S4. The **only field editable after creation is `code`** (PUT may change `code` and nothing else). [user: "Lo unico que se puede editar este codigo de accion"]
S5. `code` format: exactly 5 digits `^\d{5}$` (zero-padded), must be **unique**. Max `99999`; reject beyond. [derived: 5 chars + identifier uniqueness]
S6. An accion can later be **adjudicated/assigned to a shareholder** (phase 2). For now reserve `shareholderId` as a nullable ObjectId ref. [user: "despues se pueda adjudicar la accion a un accionista"]
S7. Acciones are a **standalone module**: own routes at `/api/acciones`, not nested under a shareholder. [user: "dejar las acciones aparte"]
S8. Drop obsolete fields from the reshaped Share: `percentage`, `acquisitionDate`, `number`, old `id`. Remove `validateSharePercentage` middleware + all usages + the obsolete share test. Keep the accionistas (shareholder) flow and its tests green. [decision: "Retiro percentage/fecha"]
S9. Auth: reads require Bearer auth; writes (create/update/delete) require `adminOnly`. Mirror the existing share-route guard style. [consistency]

## API contract (parent-confirmed, shared by backend + frontend)
- GET    `/api/acciones`        auth       -> 200 { data: [accion] }
- GET    `/api/acciones/:id`    auth       -> 200 { data: accion } | 404 { error }
- POST   `/api/acciones`        auth+admin -> 201 { data: accion } (server auto-generates `code`)
- PUT    `/api/acciones/:id`    auth+admin -> 200 { data: accion } | 400 { error } (bad 5-digit format) | 409 { error } (code exists) | 404
- DELETE `/api/acciones/:id`    auth+admin -> 200 { message } | 404
- accion shape: { _id: "<uuid>", code: "00001", shareholderId: null, createdAt, updatedAt }

## Tasks
T1. [backend] Reshape `share.model.ts` to the acciones contract (S1,S2,S4,S5,S6,S7,S8): `_id`=UUID auto, `code` (5-digit, unique), `shareholderId` nullable ref; remove `percentage`/`acquisitionDate`/`number`/`id`; adjust Shareholder model (drop `totalPercentage`, keep `shares[]` ref matching new `_id` type).
T2. [backend] Sequential code via `counters` collection (S2,S3,S5): atomic `$inc`, `padStart(5,'0')`, reject `>99999`.
T3. [backend] Standalone routes `/api/acciones` with auth+adminOnly (S7,S9); register in the app file server.js actually uses; remove the obsolete nested `/api/shareholders/:shareholderId/shares` mount and `validateSharePercentage`.
T4. [backend] Tests test-first (S..): `acciones.endpoints.test.ts` (create->00001 then 00002, guid present/unique, get/list/404, PUT only-code, reject other-field change, 400 bad format, 409 dup, 401/403 guards). Replace/remove obsolete `shareholderShares.endpoints.test.ts`. Full backend suite green incl. accionistas tests.
T5. [frontend] `AccionesManager.jsx` + `AccionModal.jsx` (create: no code input, show auto code; edit: ONLY `code`, 5-digit client validation, surface 400/409; list/delete) mirroring AccionistasManager/AccionistaModal + `useValidatedForm`; add a simple tab switch in `App.jsx` (Accionistas | Acciones), NO new router dep; component test for code validation if a harness exists.
T6. [parent] Verify: run backend + frontend suites/build, confirm accionistas flow intact, confirm contract matches, review diffs. Commit work units on a feature branch by EXPLICIT file path (do NOT bundle the user's pre-existing WIP: accionista.js, accionistas.js, server.js, package.json, .gitignore, .env.example).

## Log
L1. [user, verbatim] "Vamos a trabajar en un modulo donde se crean acciones. Una accion va a tener un identificador tipo GUID que se creara en el momento de insertarlo en la BD. Y un identificador tipo string, con 5 caracteres de longitud, represntado de la siguiente manera 00001, 00002, 00003, 00010 como ejemplos. Lo unico que se puede editar este codigo de accion."
L2. [user] Scope = backend + frontend. Drop `percentage`/`acquisitionDate`. Acciones apart (standalone). Adjudication to shareholder = phase 2.
L3. [finding] Existing `Share` contract is UNUSED (no frontend consumer; server.js only seeds accionistas; `migrate-legacy-shares.ts` never runs; only its own integration test exercises it) -> safe to reshape per user condition "si no está en uso podemos replantearlo".
L4. [decision] GUID realized as `_id` = UUID v4 string (auto at insert). Working tree has the user's uncommitted WIP; parent commits only acciones files by explicit path.
L5. [impl] Backend reshaped to `Accion` model (`_id` UUID auto, `code` 5-digit unique, `shareholderId` nullable ref), `AccionCounter` collection for the sequence, standalone `/api/acciones` (GET list/one auth; POST/PUT/DELETE auth+adminOnly; PUT only `code`, 400 bad-format / 409 dup). Old `share.model.ts`, `share.routes.ts`, `validateSharePercentage.ts`, `migrate-legacy-shares.ts`, `shareholderShares.endpoints.test.ts` removed. New `acciones.endpoints.test.ts`. NOTE: named counter model `AccionCounter` to avoid colliding with the legacy `Counter` model already registered by user-WIP `accionista.js`. Backend suite: 16/16 passed.
L6. [impl] Frontend: `AccionModal.jsx` (create = no input, code auto; edit = only `code`, 5-digit client validation, surfaces 400/409), `AccionesManager.jsx` (auth-gated: login via /api/login -> Bearer token; list/create/edit/delete), `App.jsx` adds Accionistas/Acciones tabs (no new deps). New `AccionModal.test.jsx`. Frontend suite: 87/87 passed.
L7. [note] Delegation to gentle-ai-worker failed 3x (no report / provider unavailable); backend+frontend completed inline by parent instead.
L8. [slice] Commit dc72cfa on feature/acciones-module: 17 files, 798 insertions / 283 deletions (net ~515 new lines). Exceeds 400-line guideline because it is a single logical unit (new module + removal of its obsolete predecessor) completed inline after worker failures. If further changes are needed, subsequent commits should be split ≤400 lines.