# Frontend Validation Layer

A framework-agnostic, central, extensible validation system that replicates backend validation rules in the frontend. It is highly optimized, fully tested, and provides both a dependency-free custom React hook (`useValidatedForm`) and a React Hook Form adapter.

---

## 1. Directory Layout

All validation-related files are located in `src/shared/validation/`:

```
src/shared/validation/
├── README.md               # This documentation file
├── index.js                # Core entry point (barrel exports)
├── validator.js            # Core validation engine & registry
├── useValidatedForm.js     # Dependency-free custom React hook
├── adapters/
│   └── react-hook-form.js  # React Hook Form validation adapter
└── rules/                  # Individual validator definitions
    ├── required.js         # Checks presence / emptiness
    ├── minLength.js        # Minimum string length
    ├── maxLength.js        # Maximum string length
    ├── pattern.js          # Regular expression patterns
    ├── enum.js             # List of allowed values
    ├── dateAfter.ts        # Under-date validator (cross-field)
    └── passwordMatch.ts    # String matcher validator (cross-field)
```

---

## 2. Core Validation Engine

Unifying rules into single validation definitions, the core engine in `validator.js` evaluates a value against a chain of rules.

### Rule Schema

Each validation rule is defined as a plain JavaScript object:

```js
{
  type: "ruleName",             // The rule identifier
  params: { paramName: value }, // Configuration parameters for the rule
  message: "Custom error text"  // Optional: Override default error message
}
```

---

## 3. Usage Options

### Option A: `useValidatedForm` Hook (Zero Dependencies)

The `useValidatedForm` hook is a React-only, dependency-free hook to handle forms cleanly. It manages input states, error states, and registers `change` and `blur` action handlers in real-time.

```jsx
import { useValidatedForm } from './shared/validation';

const initialValues = {
  nombre: "",
  email: ""
};

const validationRules = {
  nombre: [
    { type: 'required', message: 'El nombre es obligatorio' }
  ],
  email: [
    { type: 'required', message: 'El correo es obligatorio' },
    { type: 'pattern', params: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" }, message: 'Formato inválido' }
  ]
};

function MySimpleForm() {
  const { getFieldProps, handleSubmit, reset, fieldErrors } = useValidatedForm(initialValues, validationRules);

  const onSubmit = (values) => {
    console.log('Sending valid values:', values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="nombre">Nombre *</label>
        <input id="nombre" {...getFieldProps('nombre')} />
        {fieldErrors.nombre && <span role="alert" style={{ color: 'red' }}>{fieldErrors.nombre}</span>}
      </div>

      <div>
        <label htmlFor="email">Email *</label>
        <input id="email" {...getFieldProps('email')} />
        {fieldErrors.email && <span role="alert" style={{ color: 'red' }}>{fieldErrors.email}</span>}
      </div>

      <button type="submit">Guardar</button>
      <button type="button" onClick={reset}>Limpiar</button>
    </form>
  );
}
```

### Option B: React Hook Form Adapter

If your application already leverages **React Hook Form**, you can adapt the validation engine rules easily using `getValidatorAdapter`:

```jsx
import { useForm, Controller } from 'react-hook-form';
import { getValidatorAdapter } from './shared/validation';

const fieldRules = {
  password: [
    { type: 'required', message: 'Contraseña requerida' },
    { type: 'minLength', params: { minimum: 8 }, message: 'Contraseña corta' }
  ]
};

function MyRHFForm() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { password: '' }
  });
  const adapter = getValidatorAdapter('react-hook-form');

  const onSubmit = (data) => console.log('RHF Submitted:', data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="password"
        control={control}
        rules={{
          validate: (val) => adapter.validate(val, fieldRules.password)
        }}
        render={({ field }) => (
          <div>
            <input type="password" {...field} />
            {errors.password && <span role="alert">{errors.password.message}</span>}
          </div>
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 4. Registering Rules and Extending the System

To build or register your own validation rules, follow this simple process:

### Step 1: Create the validator rule file

Create a file under `src/shared/validation/rules/<ruleName>.js`. The file must export a validator function that takes two arguments:

- `value`: the value being validated.
- `params`: rule configuration parameters.

The function must return a `ValidationResult` object: `{ isValid: boolean, error?: string }`.

**Example: `src/shared/validation/rules/greaterThan.js`**

```js
/**
 * Triggers if the value is not greater than the specified limit
 * @param {any} value
 * @param {{ limit: number }} params
 * @returns {{isValid: boolean, error?: string}}
 */
export function greaterThan(value, { limit }) {
  const parsed = Number(value);
  if (isNaN(parsed)) {
    return { isValid: false, error: 'Debe ser un número válido' };
  }
  return parsed > limit
    ? { isValid: true }
    : { isValid: false, error: `Debe ser mayor que ${limit}` };
}
```

### Step 2: Register of the rule

Register your validator in `src/shared/validation/index.js` to expose it cleanly and attach it to the core validator RULES mapping.

Modify `src/shared/validation/index.js`:

```js
import { registerValidator } from './validator.js';
import { greaterThan } from './rules/greaterThan.js';

// Register the rule identifier
registerValidator('greaterThan', greaterThan);

// Re-export the validator for direct usage if needed
export { greaterThan };
```

---

## 5. Running Tests

Unit tests are written using **Vitest**. To run all validation-related tests, run the following command:

```bash
cd frontend
pnpm vitest run src/shared/validation/__tests__
```

We aim at keeping test coverage of the validation utility above 90% for clean, reliable code releases.
