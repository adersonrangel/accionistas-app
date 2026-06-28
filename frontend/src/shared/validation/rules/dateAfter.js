/**
 * Date after validator
 * @param {any} value - The date value to validate (string, Date, timestamp)
 * @param {{baseDate: string}} params - The base date to compare against
 * @returns {{isValid:boolean, error?:string}}
 */
export function dateAfter(value, { baseDate }) {
	if (value === null || value === undefined) {
		return { isValid: true }; // Let required handle emptiness
	}
	const inputDate = new Date(value);
	const base = new Date(baseDate);
	if (isNaN(inputDate.getTime()) || isNaN(base.getTime())) {
		return { isValid: false, error: "Fecha no válida" };
	}
	if (inputDate <= base) {
		return {
			isValid: false,
			error: `La fecha debe ser posterior a ${baseDate}`,
		};
	}
	return { isValid: true };
}
