# Design: Frontend Backend Validation Replication

## Overview

We will create a **shared validation layer** that encapsulates all validation rules extracted from the backend. This layer will be consumed by form components via hooks or higher‑order components (HOCs) depending on the frontend framework (React example shown). The design ensures:

- **Single source of truth**: validation rules live in one place (`src/shared/validation/`).
- **Framework‑agnostic core**: pure JavaScript functions that return `{ isValid: boolean; error?: string }`.
- **Framework adapters**: tiny adapters that connect the core to React Hook Form, Formik, Vue Vuelidate, etc.
- **Extensible rule definition**: each rule is a simple object with `type`, `params`, and optional `message`.

## Directory Structure

```
src/
 └─ shared/
      └─ validation/
           ├─ rules/               # atomic validator functions
           │    ├─ required.js
           │    ├─ minLength.js
           │    ├─ maxLength.js
           │    ├─ pattern.js
           │    ├─ enum.js
           │    └─ custom.js       # e.g., dateAfter, discountLimit
           ├─ validator.js         # core function: validate(value: any, rules: Rule[]) => Result
           ├─ adapters/
           │    ├─ react-hook-form.js
           │    ├─ formik.js
           │    └─ vuelidate.js
           └─ index.js             # exports: validate, getValidatorAdapter, all rules
```

### Rule Format

Each validation rule is a plain object with the following properties:

- **type** (string): Identifier of the validator function (e.g., `'required'`, `'minLength'`, `'pattern'`, `'enum'`, or a custom name like `'dateAfter'`).
- **params** (object, optional): Parameters required by the validator (e.g., `{ minimum: 6 }` for `minLength`).
- **message** (string, optional): Custom error message to display when validation fails. If omitted, the validator’s default message is used.

**Example:**

```js
{
  type: 'minLength',
  params: { minimum: 6 },
  message: 'La contraseña debe tener al menos 6 caracteres'
}
```

### Extending Rules

To add a new validation rule:

1. Create a file `src/shared/validation/rules/<ruleName>.js` exporting a function  
   `(value, params) => ({ isValid: boolean, error?: string })`.
2. Ensure the function is imported in `src/shared/validation/rules/index.js` and added to the `RULES` map (or use `registerValidator`).
3. Export the function from `src/shared/validation/rules/index.js` so it becomes part of the `RULES` map.
4. (Optional) Add a JSDoc comment describing the purpose and parameters.

After adding the rule, it can be used in any form by including a rule object with the corresponding `type` and `params`.

## Core Validation Function (`validator.js`)

```js
/**
 * @typedef {Object} Rule
 * @property {string} type - Validation type (e.g., 'required', 'minLength')
 * @property {Object<string, any>} [params] - Parameters for the validator
 * @property {string} [message] - Custom error message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string} [error]
 */

/**
 * Map of validator types to validator functions
 * @type {Object<string, function(any, Object): ValidationResult>}
 */
const RULES = {};

/**
 * Register a validator function for a given type
 * @param {string} type
 * @param {(value:any, params:Object)=>ValidationResult} validator
 */
export function registerValidator(type, validator) {
  RULES[type] = validator;
}

/**
 * Validate a value against an array of rules
 * @param {any} value
 * @param {Rule[]} rules
 * @returns {ValidationResult}
 */
export function validate(value, rules = []) {
  for (const rule of rules) {
    const validator = RULES[rule.type];
    if (!validator) {
      return { isValid: false, error: `Unknown validation type: ${rule.type}` };
    }
    const result = validator(value, rule.params || {});
    if (!result.isValid) {
      return { isValid: false, error: rule.message ?? result.error };
    }
  }
  return { isValid: true };
}

/**
 * Get adapter for a form library.
 * This is a placeholder; adapters should be implemented in ./adapters/
 * @param {string} library - name of form library (e.g., 'react-hook-form')
 * @returns {Object} adapter functions
 */
export function getValidatorAdapter(library) {
  // This function is intended to be overridden by adapters
  throw new Error(`Adapter for ${library} not implemented`);
}

// Export the RULES map for tests or direct manipulation if needed
export { RULES };
```

### Adapter Example (React Hook Form Integration)

```js
import { validate } from '../validator.js';

export function getAdapter() {
  return {
    validate: (value, rules) => {
      const result = validate(value, rules);
      return result.isValid ? true : result.error || 'Invalid';
    }
  };
}

export function getValidatorAdapter(library) {
  if (library === 'react-hook-form') {
    return getAdapter();
  }
  throw new Error(`Adapter for ${library} not implemented`);
}
```

### Custom Lightweight Hook (`useValidatedForm` in `useValidatedForm.js`)

A completely independent React hook that manages form state internally, handles validation on change and blur events, and does not require third-party libraries.

```js
import { useState } from "react";
import { validate } from "./validator.js";

export function useValidatedForm(initialValues, fieldRules) {
  const [fieldValues, setFieldValues] = useState({ ...initialValues });
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    const rules = fieldRules[name] || [];
    return validate(value, rules);
  };

  const handleChange = (name, value) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
    const result = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: result.isValid ? "" : result.error,
    }));
  };

  const handleBlur = (name, value) => {
    const result = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: result.isValid ? "" : result.error,
    }));
  };

  const resetForm = () => {
    setFieldValues({ ...initialValues });
    setFieldErrors({});
  };

  const handleSubmit = (onValid) => (e) => {
    e.preventDefault();
    let allValid = true;
    const errors = {};
    for (const fieldName in fieldRules) {
      const value = fieldValues[fieldName];
      const result = validateField(fieldName, value);
      if (!result.isValid) {
        allValid = false;
        errors[fieldName] = result.error;
      }
    }
    setFieldErrors(errors);
    if (allValid) {
      onValid(fieldValues);
    }
  };

  const getFieldProps = (name) => {
    const value = fieldValues[name] !== undefined ? fieldValues[name] : "";
    const onChange = (e) => handleChange(name, e.target.value);
    const onBlur = (e) => handleBlur(name, e.target.value);
    return { value, onChange, onBlur };
  };

  return {
    getFieldProps,
    handleSubmit,
    reset: resetForm,
    fieldErrors,
  };
}
```

### Usage Options

#### Option A: Using the Custom Lightweight Hook (`getFieldProps`)

Best for forms where you want zero external dependencies.

```jsx
import { useValidatedForm } from '@/shared/validation';

const initialValues = { email: '' };
const fieldRules = {
  email: [
    { type: 'required', message: 'Email es requerido' },
    { type: 'pattern', params: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }, message: 'Email inválido' }
  ]
};

function MyForm() {
  const { getFieldProps, handleSubmit, reset, fieldErrors } = useValidatedForm(initialValues, fieldRules);

  const onSubmit = (values) => {
    console.log('Submitting:', values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...getFieldProps('email')} />
        {fieldErrors.email && <span role="alert">{fieldErrors.email}</span>}
      </div>
      <button type="submit">Enviar</button>
      <button type="button" onClick={reset}>Limpiar</button>
    </form>
  );
}
```

#### Option B: Using the React Hook Form Adapter

Best for integrations where you already use React Hook Form (RHF) but want to use the same central validation engine and rules.

```jsx
import { useForm, Controller } from 'react-hook-form';
import { getValidatorAdapter } from '@/shared/validation';

const fieldRules = {
  email: [
    { type: 'required', message: 'Email es requerido' }
  ]
};

function MyRHFForm() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  });
  
  const adapter = getValidatorAdapter('react-hook-form');

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{
          validate: (val) => adapter.validate(val, fieldRules.email)
        }}
        render={({ field }) => (
          <div>
            <input {...field} />
            {errors.email && <span role="alert">{errors.email.message}</span>}
          </div>
        )}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

## Integration Steps

1. **Extract backend rules** – gather validation rules from existing libraries (Joi, Yup, class‑validator) or OpenAPI specs and write them as rule objects.
2. **Implement core validators** – create validator functions for each rule type under `src/shared/validation/rules/`.
3. **Create adapters** – implement adapters for the form library actually used in the project (check `package.json`).
4. **Refactor existing forms** – replace ad‑hoc validation with the `useValidatedForm` hook (or equivalent adapter) and replace manual error display with adapter‑provided validation.
5. **Write unit tests** – test each validator rule and the adapter integration (e.g., using Vitest/Jest and React Testing Library).
6. **Add bundle‑size check** – ensure the validation module adds < 5 % to the bundle (e.g., via `webpack-bundle-analyzer` in CI).
7. **Update documentation** – reflect any changes in `frontend/openspec/design.md` and any internal wiki.

## Diagram (textual)

```
+-------------------+        +---------------------+        +-------------------+
|   Form Component  | <--->  |   Adapter (RHF,   ) | <--->  |   Validation Core |
| (React/Vue/etc.)  |        |   Formik, etc.)     |        | (validate fn +    |
+-------------------+        +---------------------+        |  rule map)        |
        ^                                                          ^
        |                                                          |
        |                                                          |
        |                                                          |
+-------------------+                                    +-------------------+
|  UI (input,      |                                    |  Rule Definitions |
|  select, etc.)   |                                    | (required, etc.)  |
+-------------------+                                    +-------------------+
```

## Open Issues / Decisions

- **Source of truth** – decide whether to keep validation rules as TypeScript/JavaScript objects or generate them from OpenAPI/YAML schemas.
- **Async validations** (e.g., username uniqueness) – treat them as separate async validators that run only on submit.
- **Error i18n** – if the application needs multiple languages, consider externalizing message strings.

## Acceptance Criteria (Design)

- All validation rules from the backend’s public API are representable in the core validation module.
- Form components using the adapter display errors identical to backend responses for the covered fields.
- Adding a new rule requires ≤ 2 files (rule implementation + export) and no changes to existing form code.
- Bundle size impact stays within the agreed threshold.

---
*Design version: 1.1*  
*Date: 2026-06-28*
