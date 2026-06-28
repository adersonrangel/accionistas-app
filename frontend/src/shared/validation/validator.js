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
	// For now return a simple object that throws if not implemented
	throw new Error(`Adapter for ${library} not implemented`);
}

// Export the RULES map for tests or direct manipulation if needed
export { RULES };
