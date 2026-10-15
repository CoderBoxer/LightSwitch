import { describe, expect, it } from 'vitest'
import {
  buildPdfFilter,
  buildPdfStyle,
  isPdfDocument,
  presetAdjustments,
  type PdfThemeSettings,
} from '../../src/core/pdf'

const defaults: PdfThemeSettings = { preset: 'soft', brightness: 1, contrast: 1 }

describe('isPdfDocument', () => {
  it('accepts the pdf content type', () => {
    expect(isPdfDocument('application/pdf')).toBe(true)
  })

  it('rejects html pages', () => {
    expect(isPdfDocument('text/html')).toBe(false)
  })
})

describe('presetAdjustments', () => {
  it('makes the black preset darker than the soft one', () => {
    expect(presetAdjustments('black').brightness).toBeLessThan(presetAdjustments('soft').brightness)
  })

  it('gives the sepia preset its warmth', () => {
    expect(presetAdjustments('sepia').sepia).toBeGreaterThan(0)
  })

  it('inverts with every preset', () => {
    for (const preset of ['soft', 'black', 'sepia'] as const) {
      expect(presetAdjustments(preset).invert).toBeGreaterThan(0.8)
    }
  })
})

describe('buildPdfFilter', () => {
  it('inverts and rotates hue', () => {
    const filter = buildPdfFilter(defaults)
    expect(filter).toContain('invert(1)')
    expect(filter).toContain('hue-rotate(180deg)')
  })

  it('leaves sepia out of neutral presets', () => {
    expect(buildPdfFilter({ ...defaults, preset: 'soft' })).not.toContain('sepia')
  })

  it('applies the user brightness on top of the preset', () => {
    const brighter = buildPdfFilter({ ...defaults, brightness: 1.2 })
    const normal = buildPdfFilter(defaults)
    expect(brighter).not.toBe(normal)
    expect(brighter).toContain('brightness(1.08)')
  })

  it('clamps extreme values', () => {
    const filter = buildPdfFilter({ ...defaults, brightness: 10, contrast: 10 })
    expect(filter).toContain('brightness(2)')
    expect(filter).toContain('contrast(2)')
  })
})

describe('buildPdfStyle', () => {
  it('filters the document root for PDFs opened directly', () => {
    const css = buildPdfStyle('top-level', defaults)
    expect(css).toContain('html {')
    expect(css).toContain('filter:')
    expect(css).toContain('background-color: #17171a')
  })

  it('filters only the embed for embedded PDFs', () => {
    const css = buildPdfStyle('embedded', defaults)
    expect(css).toContain('embed[type="application/pdf"]')
    expect(css).toContain('object[type="application/pdf"]')
    expect(css).not.toContain('html {')
    expect(css).not.toContain('background-color')
  })
})
