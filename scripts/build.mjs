import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { build } from 'vite'

const outDir = 'dist'

async function bundle(entry, fileName, format) {
  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: false,
      minify: false,
      target: 'es2022',
      rollupOptions: {
        input: entry,
        output: { format, entryFileNames: fileName },
      },
    },
  })
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

await bundle('src/content/content.ts', 'content.js', 'iife')
await bundle('src/background/service-worker.ts', 'service-worker.js', 'es')
await bundle('src/popup/popup.ts', 'popup.js', 'iife')

cpSync('manifest.json', `${outDir}/manifest.json`)
cpSync('src/popup/popup.html', `${outDir}/popup.html`)
cpSync('src/popup/popup.css', `${outDir}/popup.css`)
cpSync('public/icons', `${outDir}/icons`, { recursive: true })

console.log(`Built ${outDir}/`)
