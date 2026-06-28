# Specification: Frontend Backend Validation Replication

## Functional Requirements

1. **Form Field Validation**  
   - For each form field that has backend validation (e.g., required, min/max length, pattern, enum, custom rules), the frontend must display an error when the condition fails, matching the backend error message where possible.

2. **Cross‑Field / Business Rule Validation**  
   - If the backend validates relationships between fields (e.g., “end date must be after start date”, “discount ≤ 100%”), the frontend shall implement the same logic and show an appropriate error.

3. **Error Message Mapping**  
   - Backend error codes/messages should be mapped to frontend UI strings. Where the backend returns a generic message, the frontend may use a generic counterpart but must remain consistent.

4. **Real‑time Validation**  
   - Validation should run on `blur` and/or `input` (configurable per field) to give immediate feedback, while still performing a final check on submit.

5. **Submit Blocking**  
   - Form submission must be blocked if any validation error exists, mirroring the backend’s rejection.

6. **Accessibility**  
   - Validation messages must be associated with inputs via `aria-describedby` or similar, and be announced by screen readers.

## Non‑Functional Requirements

1. **Performance**  
   - Validation functions must be pure and memoized where appropriate to avoid degrading render performance.  
   - Bundle size impact of added validation utilities must be ≤ 5 % of the current bundle (measured via webpack bundle analyzer).

2. **Maintainability**  
   - Validation logic should be sourced from a single place (e.g., a `validation/` folder or shared JSON schema) to simplify synchronization with backend changes.  
   - Code must adhere to the project’s ESLint/Prettier rules.

3. **Testability**  
   - All validation units must be unit‑tested (≥ 80 % coverage).  
   - Integration tests (e.g., using React Testing Library or Vue Test Utils) must verify that forms display correct errors and block submission.

4. **Extensibility**  
   - Adding a new backend validation rule should require adding a rule definition and, if necessary, updating the form configuration — no deep code changes.

5. **Compatibility**  
   - Must work with the existing UI library (e.g., Material‑UI, Ant Design, Vuetify) and not break existing styling or theming.

## Assumptions

- Backend validation rules are documented (e.g., via Joi, Yup, class‑validator, or OpenAPI).  
- The frontend already has a form management library in place; if not, the team will adopt one as part of this effort.  
- The team has agreed on a source of truth for validation rules (to be decided during design).

## Implemented Architecture

The validation replication has been implemented leveraging two cohesive patterns to give absolute flexibility across different component requirements:

1. **Custom, Lightweight, Dependency-Free Validation Hook (`useValidatedForm`)**: A plain React hook (`src/shared/validation/useValidatedForm.js`) that handles values, error state, and bindings manually. It returns custom field binding properties (`getFieldProps`) to wire fields and validate them in real-time on `blur` and `change`, completely independent of any form library.
2. **React Hook Form Adapter**: A dedicated integration module (`src/shared/validation/adapters/react-hook-form.js`) that provides clean adaptation between the agnostic validator engine and React Hook Form. It exposes a `validate` method suitable for RHF's validation interface, allowing robust hook-validated form execution.

## Open Questions

- Where should the shared validation definitions live? (e.g., `src/shared/validation/` or a separate npm package?)  
- Should we generate validation schemas from OpenAPI automatically, or maintain them manually?  
- How to handle asynchronous backend‑only checks (e.g., uniqueness) – should we defer them to submit time only?

## Acceptance Tests (high‑level)

1. **Field‑level**: Entering an invalid email shows the same error message as the backend.  
2. **Cross‑field**: Setting an end date before start date shows a warning and blocks submit.  
3. **Submit block**: Form with any invalid field cannot be submitted; clicking submit shows inline errors.  
4. **Unit test**: Validation utility returns expected results for edge cases.  
5. **Bundle check**: After adding validation utilities, bundle size increase is within limits.  

---
*Specification version: 1.0*  
*Date: 2026-06-28*
