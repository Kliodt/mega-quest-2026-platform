import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Пустая переменная в compose приходит строкой, а это то же самое, что «не задано» */
function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return undefined;
  }
  return value;
}

const port = Number(readEnv('WEB_PORT') ?? 5173);
const apiProxyTarget = readEnv('VITE_API_PROXY_TARGET') ?? 'http://localhost:3000';
const usePolling = readEnv('CHOKIDAR_USEPOLLING') === 'true';

/** Домены туннелей: без этого Vite отвечает «Blocked request» на чужой Host */
const TUNNEL_HOSTS = [
  '.ngrok-free.dev',
  '.ngrok-free.app',
  '.ngrok.dev',
  '.ngrok.app',
  '.ngrok.io',
  '.trycloudflare.com',
];
const extraHosts = (readEnv('WEB_ALLOWED_HOSTS') ?? '').split(',').filter(Boolean);

/** Через туннель браузер стучится за обновлениями в 443 по wss, а не в порт дев-сервера */
const hmrClientPort = Number(readEnv('WEB_HMR_CLIENT_PORT') ?? port);
const hmrProtocol = readEnv('WEB_HMR_PROTOCOL');

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port,
    strictPort: true,
    allowedHosts: [...TUNNEL_HOSTS, ...extraHosts],
    hmr: {
      clientPort: hmrClientPort,
      ...(hmrProtocol === undefined ? {} : { protocol: hmrProtocol }),
    },
    watch: { usePolling },
    proxy: {
      '/api': { target: apiProxyTarget, changeOrigin: true },
      '/docs': { target: apiProxyTarget, changeOrigin: true },
      // Дрампад стучится без префикса `/api`; остальные `/pub/*` — страницы самого сайта
      '/pub/confirm_drum': { target: apiProxyTarget, changeOrigin: true },
    },
  },
});
