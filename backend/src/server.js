const app = require("./app");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
	console.log(
		`📋 API de accionistas disponible en http://localhost:${PORT}/api/accionistas`,
	);
});
