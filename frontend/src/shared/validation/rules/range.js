/**
 * Range validator (numeric between min and max)
 * @param {any} value
 * @param {{min?:number, max?:number}} params
 * @returns {{isValid:boolean, error?:string}}
 */
export function range(value, { min, max } = {}) {
	if (value === null || value === undefined || value === "") {
		return { isValid: false, error: "Valor requerido" };
	}
	const num = typeof value === "string" ? Number(value) : value;
	if (typeof num !== "number" || Number.isNaN(num)) {
		return { isValid: false, error: "Debe ser un número" };
	}
	if (typeof min === "number" && num < min) {
		return { isValid: false, error: `Debe ser mayor o igual a ${min}` };
	}
	if (typeof max === "number" && num > max) {
		return { isValid: false, error: `Debe ser menor o igual a ${max}` };
	}
	return { isValid: true };
}
