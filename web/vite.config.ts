import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { BRAND } from './src/lib/brand.ts'

const API_TARGET = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

const brandHtml = (): Plugin => ({
  name: 'brand-html',
  transformIndexHtml: (html) =>
    html.replaceAll('%BRAND_NAME%', BRAND.name).replaceAll('%BRAND_DESCRIPTION%', BRAND.description),
})

// Preload the two latin font files the first viewport uses, so text doesn't swap faces late.
const PRELOAD_FONTS = [/geist-latin-wght-normal-[\w-]+\.woff2$/, /geist-mono-latin-wght-normal-[\w-]+\.woff2$/]

const preloadFonts = (): Plugin => ({
  name: 'preload-fonts',
  apply: 'build',
  transformIndexHtml(_html, context) {
    const files = Object.keys(context.bundle ?? {})
    const picked = new Set<string>()
    for (const pattern of PRELOAD_FONTS) {
      // "geist-latin" must not also match "geist-mono-latin".
      const match = files.find((file) => pattern.test(file) && !picked.has(file) && (pattern.source.includes('mono') || !file.includes('geist-mono')))
      if (match) picked.add(match)
    }
    return [...picked].map((file) => ({
      tag: 'link',
      attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' },
      injectTo: 'head' as const,
    }))
  },
})

const apiProxy = { '/api': { target: API_TARGET, changeOrigin: false } }

// `pnpm preview` sends the same Content-Security-Policy as nginx, so CSP problems show up locally.
const nginxHeaders = readFileSync(fileURLToPath(new URL('./nginx-security-headers.conf', import.meta.url)), 'utf8')
const csp = /Content-Security-Policy\s+"([^"]+)"/.exec(nginxHeaders)?.[1]

export default defineConfig({
  plugins: [react(), tailwindcss(), brandHtml(), preloadFonts()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy, headers: csp ? { 'Content-Security-Policy': csp } : {} },
  build: {
    target: 'es2022',
    // Every emitted asset is content-hashed (assets/[name]-[hash].[ext]); nginx serves
    // them as immutable. Fonts stay as separate files so they cache independently.
    assetsInlineLimit: 0,
    sourcemap: false,
  },
})
