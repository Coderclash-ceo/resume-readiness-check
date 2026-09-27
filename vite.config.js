import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Attach Express/Vercel compatible helpers to Node http.ServerResponse
        if (!res.status) {
          res.status = function(code) {
            this.statusCode = code;
            return this;
          };
        }
        if (!res.json) {
          res.json = function(data) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }

        if (url.startsWith('/api/check')) {

          try {
            const checkModule = await import('./api/check.js');
            const handler = checkModule.default;
            return await handler(req, res);
          } catch (err) {
            console.error('[ViteDev] /api/check error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        if (url.startsWith('/api/rubrics')) {
          try {
            const rubricsModule = await import('./api/rubrics.js');
            const handler = rubricsModule.default;
            return await handler(req, res);
          } catch (err) {
            console.error('[ViteDev] /api/rubrics error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
