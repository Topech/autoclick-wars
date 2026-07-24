import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const port = parseInt(process.env.GAME_CLIENT_PORT || '5173')

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === 'production' ? '/autoclick-wars/' : '/',
  server: {
    port,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
