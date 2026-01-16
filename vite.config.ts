
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Garante que os caminhos no index.html gerado sejam relativos
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});