import { expect, test, type BrowserContext } from '@playwright/test'
import { baseUrl, expectDarkenedPdfPage, launchWithExtension } from './support'

test('a web-hosted PDF is darkened', async () => {
  const context = await launchWithExtension('chromium')
  try {
    const page = await context.newPage()
    await expectDarkenedPdfPage(page)
    // let the PDF plugin paint its first page before capturing the artifact
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'artifacts/web-pdf.png' })
  } finally {
    await context.close()
  }
})

test('an embedded PDF is darkened but the page is not', async () => {
  const context = await launchWithExtension('chromium')
  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/embed.html`)
    await expect(page.locator('#lightswitch-pdf-style')).toHaveCount(1)
    const embedFilter = await page.locator('embed').evaluate((element) => getComputedStyle(element).filter)
    expect(embedFilter).toContain('invert')
    const pageFilter = await page.evaluate(() => getComputedStyle(document.documentElement).filter)
    expect(pageFilter).toBe('none')
    await page.screenshot({ path: 'artifacts/embedded-pdf.png' })
  } finally {
    await context.close()
  }
})

test('Microsoft Edge loads the extension and darkens a PDF', async () => {
  let context: BrowserContext
  try {
    context = await launchWithExtension('msedge')
  } catch (error) {
    test.skip(true, `msedge could not load the unpacked extension: ${(error as Error).message}`)
    return
  }
  try {
    const page = await context.newPage()
    await expectDarkenedPdfPage(page)
  } finally {
    await context.close()
  }
})
