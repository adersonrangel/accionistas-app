/**
 * Enum validator
 * @param {any} value
 * @param {{allowed:any[]}} params
 * @returns {{isValid:boolean, error?:string}}
 */
export function enumValidator(value, { allowed }) {
  if (value === null || value === undefined) {
    return { isValid: true }; // let required handle emptiness
  }
  if (!allowed.includes(value)) {
    return { isValid: false, error: `Valor no permitido. Valores permitidos: ${allowed.join(', ')}` };
  }
  return { isValid: true };
}