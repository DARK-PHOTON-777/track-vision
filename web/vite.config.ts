import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	base: '/track-vision/',
	plugins: [react()],
	preview: {
		port: 8080,
		host: '0.0.0.0',
		strictPort: true,
	},
	server: {
		port: 8080,
		host: '0.0.0.0',
		strictPort: true,
	}
});
