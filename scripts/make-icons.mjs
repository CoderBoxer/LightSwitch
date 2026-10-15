import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const SIZES = [16, 32, 48, 128]
const SUBSAMPLES = 4 // per axis, so 16 samples per pixel

const BACKGROUND = [22, 23, 27]
const PILL = [232, 234, 238]
const KNOB = [22, 23, 27]

function insideRoundedRect(u, v, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(u, x0 + r), x1 - r)
  const cy = Math.min(Math.max(v, y0 + r), y1 - r)
  const dx = u - cx
  const dy = v - cy
  return dx * dx + dy * dy <= r * r
}

function insideCircle(u, v, cx, cy, r) {
  const dx = u - cx
  const dy = v - cy
  return dx * dx + dy * dy <= r * r
}

function sampleColor(u, v) {
  if (insideCircle(u, v, 0.665, 0.5, 0.1)) return KNOB
  if (insideRoundedRect(u, v, 0.18, 0.36, 0.82, 0.64, 0.14)) return PILL
  if (insideRoundedRect(u, v, 0, 0, 1, 1, 0.22)) return BACKGROUND
  return null
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4)
  const step = 1 / SUBSAMPLES
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SUBSAMPLES; sy++) {
        for (let sx = 0; sx < SUBSAMPLES; sx++) {
          const u = (x + (sx + 0.5) * step) / size
          const v = (y + (sy + 0.5) * step) / size
          const color = sampleColor(u, v)
          if (color) {
            r += color[0]
            g += color[1]
            b += color[2]
            a += 255
          }
        }
      }
      const samples = SUBSAMPLES * SUBSAMPLES
      const offset = (y * size + x) * 4
      rgba[offset] = Math.round(r / samples)
      rgba[offset + 1] = Math.round(g / samples)
      rgba[offset + 2] = Math.round(b / samples)
      rgba[offset + 3] = Math.round(a / samples)
    }
  }
  return rgba
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const head = Buffer.alloc(4)
  head.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([head, body, crc])
}

function encodePng(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
for (const size of SIZES) {
  const file = `public/icons/icon${size}.png`
  writeFileSync(file, encodePng(size, render(size)))
  console.log(`wrote ${file}`)
}
