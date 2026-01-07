import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Copy PDF.js worker to public directory for production builds
function copyPdfWorker() {
  return {
    name: 'copy-pdf-worker',
    buildStart() {
      const workerSrc = resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
      const workerDest = resolve(__dirname, 'public/pdf.worker.min.mjs')

      if (existsSync(workerSrc) && !existsSync(workerDest)) {
        copyFileSync(workerSrc, workerDest)
        console.log('✅ PDF.js worker copied to public/')
      }
    }
  }
}

export default defineConfig({
  plugins: [
    copyPdfWorker(),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
})
