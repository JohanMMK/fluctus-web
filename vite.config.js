import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multi-page build: elke publieke pagina + het portal is een aparte HTML-entry.
// De apps (simulator) blijven achter het portal en de RBAC-filter.
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        oplossingen: resolve(__dirname, 'oplossingen.html'),
        overons: resolve(__dirname, 'over-ons.html'),
        contact: resolve(__dirname, 'contact.html'),
        portal: resolve(__dirname, 'portal.html'),
        // Energie-Compas site (eigen map ec/, internationale bestandsnamen; via host-routing
        //   geserveerd op de root van energie-compas.eu — zie server/index.js). start = home.
        ecstart: resolve(__dirname, 'ec/start.html'),
        eccontact: resolve(__dirname, 'ec/contact.html'),
        eclogin: resolve(__dirname, 'ec/login.html'),
      },
    },
  },
  server: {
    port: 5173,
    // Dev: proxy /api naar de Express-backend zodat één origin geldt.
    proxy: { '/api': 'http://localhost:8080' },
  },
});
