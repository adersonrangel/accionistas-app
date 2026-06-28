# Pull Request: Frontend Validation Layer

## Summary

Implements a shared client-side validation layer mirroring backend validation rules in the frontend to provide early feedback and improve UX.

## Changes

### 🏗️ Architecture

- **`src/shared/validation/`** — New validation module with:
  - `validator.js`: Core `validate()` engine with a pluggable rule registry
  - `useValidatedForm.js`: Custom React hook for dependency-free form validation
  - `adapters/react-hook-form.js`: Adapter for integrating with React Hook Form
  - `rules/`: Primitive and cross-field validators (required, minLength, maxLength, pattern, enum, dateAfter, passwordMatch)
- **`src/components/ValidationDemo.jsx`**: Demo component demonstrating cross-field validation

### ✅ Testing

- **80 unit + integration tests** covering all validators, edge cases, and the hook
- **100% code coverage** for the validation module (statements, functions, lines)
- Integration tests using React Testing Library for the demo form (valid submission, validation errors, submit blocking, cross-field rules)

### 📚 Documentation

- `frontend/openspec/`: SDD workflow artifacts (proposal, spec, design, tasks, exploration)
- `src/shared/validation/README.md`: Developer guide for adding new rules

### ♿ Accessibility

- Added `aria-describedby`, `role="alert"` to form validation messages in `AccionistasManager.jsx`

### 🔧 Build

- ESLint passing, build succeeds, bundle size ~198 kB (62 kB gzip)

## How to Test

```bash
cd frontend
npx vitest run          # Run all tests (80 tests, all pass)
npm run build           # Verify production build
npm run lint            # ESLint check
```

## Checklist

- [x] ESLint clean
- [x] All tests pass (80/80)
- [x] Build succeeds
- [x] Bundle within expected size
- [x] Validation matches backend rules for covered fields

## Notes

- The validation module uses a pure JavaScript approach; each rule is an independent function returning `{isValid, error}`
- Registration happens in `index.js` using `registerValidator()`
- For dynamic cross-field validation (e.g., real-time endDate > startDate), the adapter can be enhanced to pass watched values
- Server-side validation remains mandatory for security; this layer provides UX improvement only
