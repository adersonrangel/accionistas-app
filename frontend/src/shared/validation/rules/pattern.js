/**
 * Pattern validator (regex)
 * @param {any} value
 * @param {{pattern:string, flags?:string}} params
 * @returns {{isValid:boolean, error?:string}}
 */
export function pattern(value, { pattern, flags = "" }) {
	if (value === null || value === undefined || value === "") {
		return { isValid: true }; // let required handle emptiness
	}
	const str = String(value);
	const regex = new RegExp(pattern, flags);
	if (!regex.test(str)) {
		return { isValid: false, error: "Formato no válido" };
	}
	return { isValid: true };
}
