/**
 * Max length validator
 * @param {any} value
 * @param {{maximum:number}} params
 * @returns {{isValid:boolean, error?:string}}
 */
export function maxLength(value, { maximum }) {
  if (value === null || value === undefined) {
    return { isValid: true }; // undefined/null handled by required if needed
  }
  const str = String(value);
  if (str.length > maximum) {
    return { isValid: false, error: `No debe exceder los ${maximum} caracteres` };
  }
  return { isValid: true };
}