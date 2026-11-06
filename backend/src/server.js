const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/accionistas";

const { seedIfEmpty } = require("./models/accionista");

mongoose
	.connect(MONGO_URI)
	.then(async () => {
		console.log("✅ Conectado a MongoDB:", MONGO_URI);
		const seed = await seedIfEmpty();
		if (seed.seeded) {
			console.log(`🌱 Colección vacía: ${seed.count} accionistas demo insertados`);
		}
		app.listen(PORT, () => {
			console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
			console.log(
				`📋 API de accionistas disponible en http://localhost:${PORT}/api/accionistas`,
			);
		});
	})
	.catch((err) => {
		console.error("❌ No se pudo conectar a MongoDB:", err.message);
		process.exit(1);
	});
