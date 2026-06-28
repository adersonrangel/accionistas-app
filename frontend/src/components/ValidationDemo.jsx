import { useValidatedForm } from "../shared/validation";

const ValidationDemo = () => {
	const initialValues = {
		startDate: "",
		endDate: "",
		password: "",
		confirmPassword: "",
	};

	// Cross-field rules: note that for true cross-field validation, the params would need to be dynamic.
	// For demonstration, we use static baseDate and otherValue.
	// In a real app, you would use the form's watch API or a custom hook to pass dynamic values.
	const fieldRules = {
		startDate: [
			{ type: "required", message: "La fecha de inicio es obligatoria" },
			{
				type: "pattern",
				params: { pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
				message: "Formato de fecha inválido (YYYY-MM-DD)",
			},
		],
		endDate: [
			{ type: "required", message: "La fecha de fin es obligatoria" },
			{
				type: "pattern",
				params: { pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
				message: "Formato de fecha inválido (YYYY-MM-DD)",
			},
			// Cross-field: endDate must be after startDate
			// Note: In a real implementation, baseDate would be dynamic (the startDate value).
			// Here we use a fixed baseDate for demonstration.
			{
				type: "dateAfter",
				params: { baseDate: "2024-01-01" },
				message: "La fecha de fin debe ser posterior a la fecha de inicio",
			},
		],
		password: [
			{ type: "required", message: "La contraseña es obligatoria" },
			{
				type: "minLength",
				params: { minimum: 8 },
				message: "La contraseña debe tener al menos 8 caracteres",
			},
		],
		confirmPassword: [
			{ type: "required", message: "Confirme la contraseña" },
			// Cross-field: confirmPassword must match password
			// Note: In a real implementation, otherValue would be the current password field value.
			// Here we use a static value for demonstration.
			{
				type: "passwordMatch",
				params: { otherValue: "static-password-123" },
				message: "Las contraseñas no coinciden",
			},
		],
	};

	const { getFieldProps, handleSubmit, reset, fieldErrors } = useValidatedForm(
		initialValues,
		fieldRules,
	);

	const onSubmit = (data) => {
		console.log("Form submitted:", data);
		alert("Form submitted successfully! Check console.");
	};

	const handleSubmitWrapper = (e) => {
		handleSubmit(onSubmit)(e);
	};

	return (
		<div
			style={{
				maxWidth: "600px",
				margin: "2rem auto",
				padding: "1rem",
				fontFamily: "sans-serif",
			}}
		>
			<h2 style={{ color: "#333", marginBottom: "1rem" }}>
				Demo de Validación Cruzada
			</h2>
			<p style={{ color: "#666", fontSize: "0.9rem" }}>
				Este formulario demuestra validadores cruzados: dateAfter y
				passwordMatch.
			</p>
			<form
				onSubmit={handleSubmitWrapper}
				style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
			>
				<div>
					<label
						htmlFor="startDate"
						style={{ display: "block", marginBottom: "0.25rem" }}
					>
						Fecha de inicio *
					</label>
					<input
						id="startDate"
						{...getFieldProps("startDate")}
						placeholder="YYYY-MM-DD"
						style={{
							width: "100%",
							padding: "0.5rem",
							boxSizing: "border-box",
						}}
					/>
					{fieldErrors.startDate && (
						<span style={{ color: "red", fontSize: "0.85rem" }} role="alert">
							{fieldErrors.startDate}
						</span>
					)}
				</div>

				<div>
					<label
						htmlFor="endDate"
						style={{ display: "block", marginBottom: "0.25rem" }}
					>
						Fecha de fin *
					</label>
					<input
						id="endDate"
						{...getFieldProps("endDate")}
						placeholder="YYYY-MM-DD"
						style={{
							width: "100%",
							padding: "0.5rem",
							boxSizing: "border-box",
						}}
					/>
					{fieldErrors.endDate && (
						<span style={{ color: "red", fontSize: "0.85rem" }} role="alert">
							{fieldErrors.endDate}
						</span>
					)}
				</div>

				<div>
					<label
						htmlFor="password"
						style={{ display: "block", marginBottom: "0.25rem" }}
					>
						Contraseña *
					</label>
					<input
						id="password"
						type="password"
						{...getFieldProps("password")}
						placeholder="Mínimo 8 caracteres"
						style={{
							width: "100%",
							padding: "0.5rem",
							boxSizing: "border-box",
						}}
					/>
					{fieldErrors.password && (
						<span style={{ color: "red", fontSize: "0.85rem" }} role="alert">
							{fieldErrors.password}
						</span>
					)}
				</div>

				<div>
					<label
						htmlFor="confirmPassword"
						style={{ display: "block", marginBottom: "0.25rem" }}
					>
						Confirmar contraseña *
					</label>
					<input
						id="confirmPassword"
						type="password"
						{...getFieldProps("confirmPassword")}
						placeholder="Repita la contraseña"
						style={{
							width: "100%",
							padding: "0.5rem",
							boxSizing: "border-box",
						}}
					/>
					{fieldErrors.confirmPassword && (
						<span style={{ color: "red", fontSize: "0.85rem" }} role="alert">
							{fieldErrors.confirmPassword}
						</span>
					)}
				</div>

				<div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
					<button
						type="submit"
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: "#007bff",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						Enviar
					</button>
					<button
						type="button"
						onClick={reset}
						style={{
							padding: "0.75rem 1.5rem",
							backgroundColor: "#6c757d",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						Limpiar
					</button>
				</div>
			</form>
		</div>
	);
};

export default ValidationDemo;
