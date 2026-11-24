/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // 개발 중에는 /api를 백엔드로 넘긴다 (운영에서는 nginx가 같은 역할).
      // changeOrigin을 끄고 Host를 그대로 넘겨야 한다. Host를 백엔드 주소로 바꾸면
      // 브라우저가 붙이는 Origin(개발 서버 주소)과 달라져, 백엔드가 같은 출처 요청을
      // CORS 요청으로 보고 허용 목록에 없는 포트면 403으로 거절한다.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
          changeOrigin: false,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
