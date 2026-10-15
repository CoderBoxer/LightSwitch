import { writeFileSync } from 'node:fs'

// Regenerates tests/fixtures/sample.pdf. Run: node tests/fixtures/make-sample-pdf.mjs

const content = [
  'BT /F1 28 Tf 72 700 Td (LightSwitch test document) Tj ET',
  'BT /F1 12 Tf 72 664 Td (A mostly white page, like real lecture notes.) Tj ET',
  '0.85 g 72 430 468 180 re f',
  '0 g 72 160 468 180 re f',
  '1 g BT /F1 14 Tf 84 300 Td (Light text on a dark block.) Tj ET',
  'BT /F1 14 Tf 84 270 Td (It should stay readable after inversion.) Tj ET',
].join('\n')

const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
]

let pdf = '%PDF-1.4\n'
const offsets = []
objects.forEach((body, index) => {
  offsets.push(pdf.length)
  pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
})

const xrefStart = pdf.length
pdf += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`
for (const offset of offsets) {
  pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
}
pdf += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

writeFileSync(new URL('./sample.pdf', import.meta.url), pdf)
console.log('wrote sample.pdf')
