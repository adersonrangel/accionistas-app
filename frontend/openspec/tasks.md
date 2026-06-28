# Tasks: Implement backend validation logic in frontend

## Exploration

- [x] Review backend validation sources (Joi/Yup/class‑validator/OpenAPI) to extract rule list.
- [x] Identify which validation rules are safe to duplicate client‑side (exclude auth, DB‑unique, etc.)
- [x] Decide on source of truth for validation rules (TS objects vs generated schema).
- [x] Survey current form library in frontend (package.json) and choose adapter to implement first.

## Design

- [x] Create `src/shared/validation/` folder structure.
- [x] Implement core `validate` function and `Rule` TypeScript types.
- [x] Implement primitive validator functions (required, minLength, maxLength, pattern, enum, etc.).
- [x] Create adapter for the chosen form library (e.g., React Hook Form).
- [x] Document rule format and extension process in `design.md`.

## Implementation – Core Validation

- [x] Write unit tests for each primitive validator (jest/vitest).
- [x] Ensure validators are pure and memoizable.
- [x] Export a `getValidatorAdapter` helper that returns validation props for the form library.

## Implementation – Form Integration

- [x] Build a custom hook `useValidatedForm` (or equivalent) that integrates core validation with the form library.
- [x] Convert an existing simple form (e.g., login or user profile) to use the new hook.
- [x] Verify that field‑level validation shows errors on `blur`/`input` and submit is blocked.
- [x] Add accessibility attributes (`aria-describedby`, `role="alert"`).

## Implementation – Advanced Rules

- [x] Implement cross‑field validators (e.g., dateAfter, passwordMatch) as custom rules.
- [x] Add unit tests for each cross‑field rule.
- [x] Demonstrate usage in a form with multiple interdependent fields.

## Testing & Quality

- [x] Achieve ≥ 80 % unit test coverage for validation module.
- [x] Add integration tests (RTL/Vue Test Utils) covering:
  - Valid submission.
  - Invalid field shows correct error.
  - Multiple invalid fields show all errors.
  - Submit blocked until all errors resolved.
- [x] Run bundle analysis and confirm < 5 % increase.
- [x] Run ESLint/Prettier and fix any lint errors.

## Documentation & Sync

- [x] Update `frontend/openspec/spec.md` with any changes discovered during implementation.
- [x] Update `frontend/openspec/design.md` with final adapter details and extension guide.
- [x] Add a README in `src/shared/validation/` explaining how to add new rules.
- [ ] If adopting generated schemas, add script to convert OpenAPI/YAML to validation rules.

## Review & Release

- [x] Conduct self‑review using checklist.
- [ ] Request peer review (tag relevant teammates).
- [ ] Address review comments.
- [x] Prepare PR with target branch for merge (e.g., `feature/frontend-validation`).
- [x] After merge, verify staging/build passes.
- [x] Update changelog / release notes.

## Optional (Future)

- [ ] Implement async validation wrapper for server‑only checks (e.g., uniqueness) that runs on submit.
- [ ] Add i18n support for validation messages.
- [ ] Create a storybook showcase of validation components.

---
*Task list version: 1.0*  
*Date: 2026-06-28*
