// Fails the build when the inline theme script in dist/index.html is not allowed by the
// Content-Security-Policy in nginx-security-headers.conf. Run after `vite build`.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const html = readFileSync(`${root}dist/index.html`, 'utf8')
const headers = readFileSync(`${root}nginx-security-headers.conf`, 'utf8')

const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1] ?? '')
const missing = inline
  .map((body) => `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  .filter((source) => !headers.includes(source))

if (missing.length > 0) {
  console.error(`CSP check failed. Add to script-src in nginx-security-headers.conf:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}
console.log(`CSP check passed (${inline.length} inline script${inline.length === 1 ? '' : 's'} allowed).`)
