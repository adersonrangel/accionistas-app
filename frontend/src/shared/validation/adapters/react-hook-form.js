import { validate } from '../validator.js';

/**
 * Returns an adapter object for React Hook Form.
 * The adapter provides a validate function compatible with RHF's `validate` prop.
 */
export function getAdapter() {
  return {
    /**
     * Validate a value against the rules defined in the validation registry.
     * @param {any} value
     * @param {import('../validator.js').Rule[]} rules
     * @returns {true|string} true if valid, error message string if invalid
     */
    validate: (value, rules) => {
      const result = validate(value, rules);
      return result.isValid ? true : result.error || 'Invalid';
    }
  };
}

/**
 * Entry point expected by getValidatorAdapter in validator.js
 * @param {string} library - must be 'react-hook-form'
 * @returns {object} adapter
 */
export function getValidatorAdapter(library) {
  if (library === 'react-hook-form') {
    return getAdapter();
  }
  throw new Error(`Adapter for ${library} not implemented`);
}