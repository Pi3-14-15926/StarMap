import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, '../packages/ui/src'),
    },
  },
  build: {
    outDir: '../dist/admin',
    emptyOutDir: true,
  },
})
