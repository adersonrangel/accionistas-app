import { validate, registerValidator } from "./validator.js";
import { required } from "./rules/required.js";
import { minLength } from "./rules/minLength.js";
import { maxLength } from "./rules/maxLength.js";
import { pattern } from "./rules/pattern.js";
import { enumValidator } from "./rules/enum.js";
import { dateAfter } from "./rules/dateAfter.js";
import { passwordMatch } from "./rules/passwordMatch.js";
import { getValidatorAdapter as rhfAdapter } from "./adapters/react-hook-form.js";
import { useValidatedForm } from "./useValidatedForm.js";

registerValidator("required", required);
registerValidator("minLength", minLength);
registerValidator("maxLength", maxLength);
registerValidator("pattern", pattern);
registerValidator("enum", enumValidator);
registerValidator("dateAfter", dateAfter);
registerValidator("passwordMatch", passwordMatch);

export { validate, registerValidator };
export {
	required,
	minLength,
	maxLength,
	pattern,
	enumValidator,
	dateAfter,
	passwordMatch,
};
export { rhfAdapter as getValidatorAdapter };
export { useValidatedForm };
