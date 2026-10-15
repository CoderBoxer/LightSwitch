import { expect, test } from '@playwright/test'
import { expectDarkenedPdfPage, extensionIdOf, launchWithExtension, pdfFilter } from './support'

test('popup switches themes and toggles dark mode live', async () => {
  const context = await launchWithExtension('chromium')
  try {
    const extensionId = await extensionIdOf(context)
    const pdf = await context.newPage()
    await expectDarkenedPdfPage(pdf)
    expect(await pdfFilter(pdf)).toContain('brightness(0.9)')

    const popup = await context.newPage()
    await popup.goto(`chrome-extension://${extensionId}/popup.html`)
    await expect(popup.getByRole('heading', { name: 'LightSwitch' })).toBeVisible()
    await expect(popup.getByRole('button', { name: 'Soft' })).toHaveClass(/active/)
    await popup.locator('body').screenshot({ path: 'artifacts/popup.png' })

    await popup.getByRole('button', { name: 'Black' }).click()
    await expect.poll(() => pdfFilter(pdf)).toContain('brightness(0.75)')

    await popup.locator('label.switch').click()
    await expect.poll(() => pdfFilter(pdf)).toBe('none')
    await expect(pdf.locator('#lightswitch-pdf-style')).toHaveCount(0)

    await popup.locator('label.switch').click()
    await expect.poll(() => pdfFilter(pdf)).toContain('brightness(0.75)')
  } finally {
    await context.close()
  }
})
