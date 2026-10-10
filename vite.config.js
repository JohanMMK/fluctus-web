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
        // Franstalige versie (ec/fr/*) → via host-routing geserveerd op /fr, /fr/contact, /fr/login.
        ecfrstart: resolve(__dirname, 'ec/fr/start.html'),
        ecfrcontact: resolve(__dirname, 'ec/fr/contact.html'),
        ecfrlogin: resolve(__dirname, 'ec/fr/login.html'),
        // Engelstalige versie (ec/en/*) → via host-routing op /en, /en/contact, /en/login (2026-10-10).
        ecenstart: resolve(__dirname, 'ec/en/start.html'),
        ecencontact: resolve(__dirname, 'ec/en/contact.html'),
        ecenlogin: resolve(__dirname, 'ec/en/login.html'),
      },
    },
  },
  server: {
    port: 5173,
    // Dev: proxy /api naar de Express-backend zodat één origin geldt.
    proxy: { '/api': 'http://localhost:8080' },
  },
});
