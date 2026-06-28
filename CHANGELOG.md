# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.0] - 2026-06-28

### Added

- Implemented shared validation layer in `frontend/src/shared/validation/`
  - Core `validate()` function with extensible rule registry
  - Primitive validators: `required`, `minLength`, `maxLength`, `pattern`, `enum`
  - Cross-field validators: `dateAfter`, `passwordMatch`
  - Custom React hook `useValidatedForm` for dependency-free form validation
  - Adapter for `react-hook-form` library integration
- Full unit test suite (80 tests) with 100% code coverage
  - Unit tests for each validator (edge cases, error states)
  - Integration tests for ValidationDemo component (React Testing Library)
  - Adapter tests for react-hook-form integration
- SDD artifacts under `frontend/openspec/`
  - Proposal, Specification, Design, and Task documentation
  - Exploration summary
- Validation demo component `ValidationDemo.jsx` showcasing cross-field rules
- `README.md` in validation directory documenting extension guide
- Accessibility improvements in `AccionistasManager.jsx`
  - ARIA attributes (`aria-describedby`, `role="alert"`) on form fields
  - Real-time field validation on blur/input with error display
- ESLint and build configuration updates in `vite.config.js`

### Changed

- `AccionistasManager.jsx` refactored to use `useValidatedForm` hook
- `package.json` and `pnpm-lock.yaml` updated as needed

### Fixed

- Lint warnings (unused catch variables) in `AccionistasManager.jsx`
- Import alias resolution for `@/shared/validation` → relative path

## [v0.0.0] - Initial state

- Baseline project with backend validation only
