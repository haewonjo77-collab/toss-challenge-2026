import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/toss-challenge-2026/',
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.dev'],
  },
});
