// Generates src/shared/api/schema.d.ts from ../server/openapi.json; skips quietly if the spec is absent.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const spec = new URL('../../server/openapi.json', import.meta.url)
if (!existsSync(spec)) {
  console.warn('gen:api skipped: server/openapi.json not found')
  process.exit(0)
}
const out = new URL('../src/shared/api/schema.d.ts', import.meta.url)
const r = spawnSync('npx', ['openapi-typescript', spec.pathname.replace(/^\/(\w:)/, '$1'), '-o', out.pathname.replace(/^\/(\w:)/, '$1')], { stdio: 'inherit', shell: true })
process.exit(r.status ?? 1)
