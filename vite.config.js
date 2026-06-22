import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import imagemin from 'vite-plugin-imagemin'
import fs from 'fs'
import path from 'path'

const imageAssetPattern = /\.(png|jpeg|gif|jpg|bmp|svg)$/i

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.VITE_BASE_PATH
  || (process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}/` : '/')
const excludedImageminAssets = ['m_sante.jpg', 'developpement-DK8ewmSc.png', 'recherche-BIlyfG4h.png']

// Plugin to inline critical CSS
const inlineCriticalCss = {
  name: 'inline-critical-css',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      try {
        const criticalCssPath = path.resolve(__dirname, 'src/styles/critical.css')
        const criticalCss = fs.readFileSync(criticalCssPath, 'utf-8')
        const deferredStylesHtml = html.replace(
          /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/,
          '<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;this.rel=\'stylesheet\'">\n    <noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
        )
        const inlined = deferredStylesHtml.replace(
          '</head>',
          `<style>${criticalCss}</style>\n</head>`
        )
        return inlined
      } catch (err) {
        console.error('Failed to inline critical CSS:', err.message)
        return html
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    imagemin({
      filter: (file) => imageAssetPattern.test(file) && !excludedImageminAssets.some((asset) => file.includes(asset)),
      gifsicle: { optimizationLevel: 7, interlaced: false },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 75, progressive: true },
      pngquant: { quality: [0.6, 0.8], speed: 4 },
      webp: { quality: 75 },
      svg: { plugins: [{ removeViewBox: false }] },
    }),
    inlineCriticalCss,
  ],
  base,
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor dependencies with long-term cache
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-data': ['d3', 'leaflet', 'echarts', 'echarts-for-react'],
          'vendor-i18n': ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
          'vendor-ui': ['@supabase/supabase-js', 'react-leaflet'],
        },
      },
    },
  },
})
