import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Two pages, one site:
//   index.html  the cinematic front page, served at "/"
//   app.html    the React app, served for every other route (/books, /tools/..., /library, ...)
// Hosts need the same rule: public/_redirects (Netlify) and vercel.json do it in production.
function appFallback(): Plugin {
  const rewrite = (req: IncomingMessage, _res: ServerResponse, next: () => void) => {
    const path = (req.url || '/').split('?')[0];
    const isFile = /\.[a-z0-9]+$/i.test(path);
    const isInternal = path.startsWith('/@') || path.startsWith('/node_modules') || path.startsWith('/src');
    if (path !== '/' && !isFile && !isInternal && req.headers.accept?.includes('text/html')) {
      req.url = '/app.html' + (req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    }
    next();
  };
  return {
    name: 'app-fallback',
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  plugins: [react(), appFallback()],
  appType: 'mpa',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app.html', import.meta.url)),
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
