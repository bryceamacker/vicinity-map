import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['three'],
  },
  resolve: {
    alias: {
      // Ensure all imports of Three.js use the same instance
      'three': path.resolve('./node_modules/three')
    }
  },
});
