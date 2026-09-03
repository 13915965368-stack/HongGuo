import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  // 生产预览（npm run preview）：对外提供 dist 静态服务，/api 照样转发到 Express
  // 内网穿透 / 正式部署前的生产形态验证都走这个端口
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
