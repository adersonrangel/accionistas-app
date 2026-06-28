/**
 * Required validator
 * @param {any} value
 * @param {{}} params (unused)
 * @returns {{isValid:boolean, error?:string}}
 */
/* eslint-disable-next-line no-unused-vars */
export function required(value, _params) {
	if (value === null || value === undefined) {
		return { isValid: false, error: "Este campo es obligatorio" };
	}
	if (typeof value === "string" && value.trim() === "") {
		return { isValid: false, error: "Este campo es obligatorio" };
	}
	return { isValid: true };
}
