import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../fixtures/', import.meta.url))
const port = Number(process.env.PORT ?? 4173)

const MIME = {
  '.html': 'text/html',
  '.pdf': 'application/pdf',
}

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://localhost:${port}`).pathname)
  // /sample is an extensionless alias for sample.pdf: download managers such
  // as IDM grab *.pdf URLs in the browser and abort the navigation, while the
  // bytes and the Content-Type the browser sees are identical either way.
  const requested = pathname === '/' ? 'index.html' : pathname === '/sample' ? 'sample.pdf' : pathname
  const file = join(root, requested)
  try {
    const data = await readFile(file)
    response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    response.end(data)
  } catch {
    response.writeHead(404)
    response.end('not found')
  }
}).listen(port, () => console.log(`fixtures served on http://localhost:${port}`))
