import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { deflateRawSync } from 'node:zlib'

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function listFiles(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) files.push(...listFiles(path))
    else files.push(path)
  }
  return files.sort()
}

const DEFAULT_DATE = 0x5a21 // 2025-01-01
const DEFAULT_TIME = 0x6066 // 12:03:12

const version = JSON.parse(readFileSync('manifest.json', 'utf8')).version
const entries = []
let offset = 0

for (const file of listFiles('dist')) {
  const name = relative('dist', file).split(sep).join('/')
  const nameBytes = Buffer.from(name, 'utf8')
  const data = readFileSync(file)
  const compressed = deflateRawSync(data)
  const crc = crc32(data)

  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt16LE(0, 6)
  local.writeUInt16LE(8, 8)
  local.writeUInt16LE(DEFAULT_TIME, 10)
  local.writeUInt16LE(DEFAULT_DATE, 12)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(compressed.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(nameBytes.length, 26)
  local.writeUInt16LE(0, 28)

  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(20, 4)
  central.writeUInt16LE(20, 6)
  central.writeUInt16LE(0, 8)
  central.writeUInt16LE(8, 10)
  central.writeUInt16LE(DEFAULT_TIME, 12)
  central.writeUInt16LE(DEFAULT_DATE, 14)
  central.writeUInt32LE(crc, 16)
  central.writeUInt32LE(compressed.length, 20)
  central.writeUInt32LE(data.length, 24)
  central.writeUInt16LE(nameBytes.length, 28)
  central.writeUInt16LE(0, 30)
  central.writeUInt16LE(0, 32)
  central.writeUInt16LE(0, 34)
  central.writeUInt16LE(0, 36)
  central.writeUInt32LE(0, 38)
  central.writeUInt32LE(offset, 42)

  entries.push({ local, central, nameBytes, compressed })
  offset += local.length + nameBytes.length + compressed.length
}

const centralSize = entries.reduce((sum, entry) => sum + entry.central.length + entry.nameBytes.length, 0)

const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0)
end.writeUInt16LE(0, 4)
end.writeUInt16LE(0, 6)
end.writeUInt16LE(entries.length, 8)
end.writeUInt16LE(entries.length, 10)
end.writeUInt32LE(centralSize, 12)
end.writeUInt32LE(offset, 16)
end.writeUInt16LE(0, 20)

mkdirSync('release', { recursive: true })
const out = `release/lightswitch-${version}.zip`
writeFileSync(
  out,
  Buffer.concat([
    ...entries.flatMap(({ local, nameBytes, compressed }) => [local, nameBytes, compressed]),
    ...entries.flatMap(({ central, nameBytes }) => [central, nameBytes]),
    end,
  ]),
)
console.log(`Packaged dist/ -> ${out}`)
