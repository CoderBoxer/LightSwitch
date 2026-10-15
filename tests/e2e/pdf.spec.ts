import { expect, test, type BrowserContext } from '@playwright/test'
import { baseUrl, expectDarkenedPdfPage, launchWithExtension } from './support'

test('a web-hosted PDF is darkened', async () => {
  const context = await launchWithExtension('chromium')
  try {
    const page = await context.newPage()
    await expectDarkenedPdfPage(page)
    // artifact only: capturing the PDF plugin needs its first paint and is
    // unreliable on headless Linux, never fail the test over it
    try {
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'artifacts/web-pdf.png' })
    } catch {
      console.log('web-pdf.png skipped: screenshot unavailable in this environment')
    }
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

test('a late-added embedded PDF is darkened', async () => {
  const context = await launchWithExtension('chromium')
  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/embed-lazy.html`)
    await expect(page.locator('#lightswitch-pdf-style')).toHaveCount(1)
    const embedFilter = await page.locator('embed').evaluate((element) => getComputedStyle(element).filter)
    expect(embedFilter).toContain('invert')
    const pageFilter = await page.evaluate(() => getComputedStyle(document.documentElement).filter)
    expect(pageFilter).toBe('none')
  } finally {
    await context.close()
  }
})

test('a PDF inside an iframe is darkened', async () => {
  const context = await launchWithExtension('chromium')
  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/iframe.html`)
    const handle = await page.locator('iframe').elementHandle()
    const frame = await handle?.contentFrame()
    expect(frame).not.toBeNull()
    await expect(frame!.locator('#lightswitch-pdf-style')).toHaveCount(1)
    const frameDarkened = await frame!.evaluate(() => {
      const htmlFilter = getComputedStyle(document.documentElement).filter
      const embed = document.querySelector('embed')
      const embedFilter = embed ? getComputedStyle(embed).filter : 'none'
      return htmlFilter.includes('invert') || embedFilter.includes('invert')
    })
    expect(frameDarkened).toBe(true)
    const pageFilter = await page.evaluate(() => getComputedStyle(document.documentElement).filter)
    expect(pageFilter).toBe('none')
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
