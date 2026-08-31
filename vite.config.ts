import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/2026-PIDIS-lab/' : '/',
  build: { outDir: 'dist', sourcemap: true },
  server: { watch: { ignored: ['**/.qa/**', '**/reports/**'] } },
}));
