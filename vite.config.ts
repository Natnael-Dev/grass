import fs from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
  plugins: [
    {
      name: 'serve-404',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/404.html') {
            const html = await fs.promises.readFile(resolve(__dirname, '404.html'), 'utf-8');
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
});
