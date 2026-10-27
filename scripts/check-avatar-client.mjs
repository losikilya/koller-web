import { readdirSync, readFileSync } from 'node:fs'
const root = 'apps/web/.next/static',
  secret = process.env.LOCAL_AVATAR_SERVICE_KEY
if (!secret)
  throw new Error(
    'Client secret check requires the local verification launcher'
  )
const walk = (path) =>
  readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(path + '/' + entry.name)
      : [path + '/' + entry.name]
  )
const files = walk(root).filter((path) => /\.(?:js|map)$/.test(path))
if (!files.length)
  throw new Error('Build browser assets before checking avatar isolation')
for (const file of files) {
  const bytes = readFileSync(file)
  if (
    bytes.includes(Buffer.from(secret)) ||
    bytes.includes(Buffer.from('LOCAL_AVATAR_SERVICE_KEY'))
  )
    throw new Error(
      'Privileged avatar material found in browser assets; value and path withheld'
    )
}
console.log(
  'PASS: privileged avatar key and server-only configuration absent from ' +
    files.length +
    ' browser assets'
)
