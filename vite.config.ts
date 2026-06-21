import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { bakeDefaultsPlugin } from './vite-plugin-bake'
import { crawlPlugin } from './vite-plugin-crawl'

export default defineConfig({
  plugins: [react(), tailwindcss(), bakeDefaultsPlugin(), crawlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@ui': path.resolve(__dirname, 'packages/ui/src'),
      '@nav': path.resolve(__dirname, 'apps/nav'),
      '@software': path.resolve(__dirname, 'apps/software'),
      '@tools': path.resolve(__dirname, 'apps/tools'),
      '@blog': path.resolve(__dirname, 'apps/blog'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
