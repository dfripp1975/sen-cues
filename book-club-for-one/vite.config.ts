import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { books } from './src/data/books';
import { tools } from './src/data/tools';

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


// Files generated from settings at build time, so going live is a matter of
// filling in .env: the AdSense account tag and script, ads.txt, robots.txt and
// a sitemap listing every book, reading page and tool.
//   VITE_SITE_URL        https://your-domain (no trailing slash)
//   VITE_ADSENSE_CLIENT  ca-pub-1234567890123456
function siteFiles(env: Record<string, string>): Plugin {
  const site = (env.VITE_SITE_URL || 'https://thebookclubforone.com').replace(/\/$/, '');
  const client = env.VITE_ADSENSE_CLIENT || '';
  const valid = /^ca-pub-\d{10,20}$/.test(client);
  return {
    name: 'site-files',
    transformIndexHtml(html, ctx) {
      if (!valid) return html;
      const tags = [`<meta name="google-adsense-account" content="${client}">`];
      // The front page has no book text, so it may carry ads (and Google's consent message).
      // The app loads the script itself and keeps it off reading pages.
      if (ctx.filename.endsWith('index.html')) {
        tags.push(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>`);
      }
      return html.replace('</head>', `${tags.join('\n')}\n</head>`);
    },
    generateBundle() {
      if (valid) {
        this.emitFile({ type: 'asset', fileName: 'ads.txt', source: `google.com, ${client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n` });
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source:
        ['User-agent: *', 'Allow: /', 'Disallow: /library', 'Disallow: /dashboard', 'Disallow: /signin', 'Disallow: /signup', '', `Sitemap: ${site}/sitemap.xml`, ''].join('\n') });
      const paths = [
        '/', '/books', '/tools', '/pricing', '/about', '/contact', '/privacy', '/cookies', '/terms', '/disclaimer', '/reading-goals',
        ...tools.map(t => `/tools/${t.slug}`),
        ...books.map(b => `/book/${b.slug}`),
        ...books.filter(b => b.readSlug).map(b => `/read/${b.slug}`),
      ];
      const urls = [...new Set(paths)].map(p => `  <url><loc>${site}${p}</loc></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source:
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), appFallback(), siteFiles(loadEnv(mode, process.cwd(), 'VITE_'))],
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
}));
