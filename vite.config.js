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
        // Energie-Compas site (los van de bestaande pagina's, geen Fluctus-verwijzing)
        ec: resolve(__dirname, 'energie-compas.html'),
        eccontact: resolve(__dirname, 'ec-contact.html'),
        mijnec: resolve(__dirname, 'mijnec.html'),
      },
    },
  },
  server: {
    port: 5173,
    // Dev: proxy /api naar de Express-backend zodat één origin geldt.
    proxy: { '/api': 'http://localhost:8080' },
  },
});
