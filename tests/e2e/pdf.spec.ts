import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const extensionPath = fileURLToPath(new URL('../../dist', import.meta.url))
const baseUrl = 'http://localhost:4173'
const pdfUrl = `${baseUrl}/sample`

async function launchWithExtension(channel: 'chromium' | 'msedge'): Promise<BrowserContext> {
  const userDataDir = mkdtempSync(join(tmpdir(), `lightswitch-${channel}-`))
  return chromium.launchPersistentContext(userDataDir, {
    channel,
    headless: false,
    ignoreDefaultArgs: [
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages',
    ],
    args: [`--load-extension=${extensionPath}`],
  })
}

async function expectDarkenedPdfPage(page: Page) {
  await page.goto(pdfUrl)
  expect(await page.evaluate(() => document.contentType)).toBe('application/pdf')
  await expect(page.locator('#lightswitch-pdf-style')).toHaveCount(1)
  const filter = await page.evaluate(() => getComputedStyle(document.documentElement).filter)
  expect(filter).toContain('invert')
  expect(filter).toContain('hue-rotate(180deg)')
}

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
