import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ plugins: [vue()], server: { port: 5173, proxy: { '/api': 'http://localhost:8080', '/aigc': 'http://localhost:8080', '/auth': 'http://localhost:8080', '/captcha': 'http://localhost:8080', '/resource': 'http://localhost:8080', '/system': 'http://localhost:8080' } } })
