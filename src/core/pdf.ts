export type Preset = 'soft' | 'black' | 'sepia'

export type PdfContext = 'top-level' | 'embedded'

export interface ThemeAdjustments {
  invert: number
  sepia: number
  brightness: number
  contrast: number
}

export interface PdfThemeSettings {
  preset: Preset
  brightness: number
  contrast: number
}

export const PDF_EMBED_SELECTOR = [
  'embed[type="application/pdf"]',
  'embed[type="application/x-google-chrome-pdf"]',
  'object[type="application/pdf"]',
].join(', ')

const PRESETS: Record<Preset, ThemeAdjustments> = {
  soft: { invert: 1, sepia: 0, brightness: 0.9, contrast: 1 },
  black: { invert: 1, sepia: 0, brightness: 0.75, contrast: 1.05 },
  sepia: { invert: 0.92, sepia: 0.3, brightness: 0.85, contrast: 1 },
}

export function presetAdjustments(preset: Preset): ThemeAdjustments {
  return { ...PRESETS[preset] }
}

export function isPdfDocument(contentType: string): boolean {
  return contentType === 'application/pdf'
}

export function buildPdfFilter(settings: PdfThemeSettings): string {
  const adjustments = presetAdjustments(settings.preset)
  const brightness = clamp(adjustments.brightness * settings.brightness, 0, 2)
  const contrast = clamp(adjustments.contrast * settings.contrast, 0, 2)
  const parts = [`invert(${round(adjustments.invert)})`]
  if (adjustments.sepia > 0) parts.push(`sepia(${round(adjustments.sepia)})`)
  parts.push('hue-rotate(180deg)', `brightness(${round(brightness)})`, `contrast(${round(contrast)})`)
  return parts.join(' ')
}

export function buildPdfStyle(context: PdfContext, settings: PdfThemeSettings): string {
  const filter = buildPdfFilter(settings)
  if (context === 'top-level') {
    return `html { filter: ${filter} !important; background-color: #17171a !important; }`
  }
  return `${PDF_EMBED_SELECTOR} { filter: ${filter} !important; }`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
