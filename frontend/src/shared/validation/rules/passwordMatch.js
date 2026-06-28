/**
 * Password match validator
 * @param {any} value - The confirm password value to validate
 * @param {{otherValue: any}} params - The password field value to match against (passed as otherValue)
 * @returns {{isValid:boolean, error?:string}}
 */
export function passwordMatch(value, { otherValue }) {
	if (value === null || value === undefined) {
		return { isValid: true }; // Let required handle emptiness
	}
	if (otherValue === undefined) {
		return {
			isValid: false,
			error: "Campo de contraseña no proporcionado para comparación",
		};
	}
	if (value !== otherValue) {
		return { isValid: false, error: "Las contraseñas no coinciden" };
	}
	return { isValid: true };
}
