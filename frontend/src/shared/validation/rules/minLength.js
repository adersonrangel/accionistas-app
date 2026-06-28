/**
 * Min length validator
 * @param {any} value
 * @param {{minimum:number}} params
 * @returns {{isValid:boolean, error?:string}}
 */
export function minLength(value, { minimum }) {
	if (value === null || value === undefined) {
		return { isValid: true }; // let required handle emptiness
	}
	const str = String(value);
	if (str.length < minimum) {
		return {
			isValid: false,
			error: `Debe tener al menos ${minimum} caracteres`,
		};
	}
	return { isValid: true };
}
