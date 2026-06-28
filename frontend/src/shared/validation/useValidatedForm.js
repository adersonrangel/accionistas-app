// src/shared/validation/useValidatedForm.js
import { useState } from "react";
import { validate } from "./validator.js";

/**
 * Custom hook that integrates core validation with form handling.
 * Returns field props, submit handler, reset, and field errors.
 * @param {Object} initialValues - default form values
 * @param {Object} fieldRules - validation rules per field name
 * @returns {Object} { getFieldProps, handleSubmit, reset, fieldErrors, fieldValues }
 */
export function useValidatedForm(initialValues, fieldRules) {
	const [fieldValues, setFieldValues] = useState({ ...initialValues });
	const [fieldErrors, setFieldErrors] = useState({});

	const validateField = (name, value) => {
		const rules = fieldRules[name] || [];
		const result = validate(value, rules);
		return result;
	};

	const handleChange = (name, value) => {
		setFieldValues((prev) => ({ ...prev, [name]: value }));
		const result = validateField(name, value);
		setFieldErrors((prev) => ({
			...prev,
			[name]: result.isValid ? "" : result.error,
		}));
	};

	const handleBlur = (name, value) => {
		const result = validateField(name, value);
		setFieldErrors((prev) => ({
			...prev,
			[name]: result.isValid ? "" : result.error,
		}));
	};

	const resetForm = () => {
		setFieldValues({ ...initialValues });
		setFieldErrors({});
	};

	const handleSubmit = (onValid) => (e) => {
		e.preventDefault();
		let allValid = true;
		const errors = {};
		for (const fieldName in fieldRules) {
			const value = fieldValues[fieldName];
			const result = validateField(fieldName, value);
			if (!result.isValid) {
				allValid = false;
				errors[fieldName] = result.error;
			}
		}
		setFieldErrors(errors);
		if (allValid) {
			onValid(fieldValues);
		}
	};

	const getFieldProps = (name) => {
		const value = fieldValues[name] !== undefined ? fieldValues[name] : "";
		const onChange = (e) => handleChange(name, e.target.value);
		const onBlur = (e) => handleBlur(name, e.target.value);
		return { value, onChange, onBlur };
	};

	return {
		getFieldProps,
		handleSubmit,
		reset: resetForm,
		fieldErrors,
		fieldValues,
	};
}
