import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // allow network access (0.0.0.0) so the dev server is reachable from other devices
    host: true,
    port: 5173,
    strictPort: true, // Forces it to stick to 5173 so your port numbers match up
    hmr: {
      host: '192.168.0.119', // Tells the browser exactly where to find the WebSocket server
      port: 5173,            // Matches the main server port
    },
  },
});