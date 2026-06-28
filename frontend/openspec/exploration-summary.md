# Exploration Summary

## Backend Validation Sources

- **Mongoose schemas** (`share.model.ts`, `shareholder.model.ts`):
  - Required fields (`required: true`)
  - Numeric min/max (`percentage: { min: 0, max: 100 }`)
  - Unique index (`id: { unique: true }`)
- **Custom middleware** (`validateSharePercentage.ts`):
  - Required fields (`shareholderId`, `percentage`)
  - Existence check (`Shareholder.findById`)
  - Aggregate validation (`total percentage ≤ 100`)
- **Route‑level checks**:
  - `accionistas.js`: required fields (`nombre`, `apellido`, `dni`, `email`, `porcentajeAcciones`)
  - `auth.routes.ts`: required fields (`username`, `password`)

## Safe‑to‑Duplicate Client‑Side

- Required field presence
- Numeric ranges (min/max)
- Simple format patterns (email, DNI regex) – can be added even if backend does not validate
- Min/max length for strings
- Enum‑like validation (if values are fixed)
**Exclude from client duplication:**
- Database existence checks (e.g., “shareholder exists”)
- Uniqueness constraints requiring server‑side index
- Aggregate calculations that depend on other records (e.g., sum of percentages per shareholder)
- Authentication / authorization logic

## Source of Truth Decision

Adopt **TypeScript objects** as the source of truth:

- Define each validation rule as a plain object (`{ type: 'required' }`, `{ type: 'minLength', params: { limit: 3 } }`, etc.)
- Implement a core `validate(value: any, rules: Rule[]): { isValid: boolean; error?: string }` function.
- Provide adapter(s) for form libraries (starting with React Hook Form).
- Keep rule definitions in `src/shared/validation/rules/` and export via `index.ts`.
This avoids a build‑time code‑generation step while keeping validation logic centralized and type‑safe.

## Frontend Form Library Survey

`frontend/package.json` shows only `react` and `react-dom`; no form library is currently installed.
Selected adapter for first implementation: **React Hook Form** (RHF)

- RHF is lightweight, performant, and integrates well with custom validation via its `resolver` API or a custom hook (`useForm` + `handleSubmit`).
- Will install `react-hook-form` as a dependency when moving to implementation.

## Next Steps

1. Create `src/shared/validation/` folder structure.
2. Implement core validator and primitive rule functions.
3. Add React Hook Form adapter.
4. Migrate an existing simple form (e.g., login) to use the new validation hook.
5. Write unit tests for each rule and integration tests for form usage.
