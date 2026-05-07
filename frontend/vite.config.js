import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,

    allowedHosts: [
      'ingenious-flow-production-ef5c.up.railway.app',
    ],
  },
});
