import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true, // Para poder usar describe, it, expect sin importarlos
		environment: "node", // Entorno Node para tests de backend
		setupFiles: ["./test/setup.ts"], // Conexión MongoDB in-memory
		testTimeout: 30000, // 30s para mongodb-memory-server
	},
});
