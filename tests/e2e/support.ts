import { chromium, expect, type BrowserContext, type Page } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const extensionPath = fileURLToPath(new URL('../../dist', import.meta.url))
export const baseUrl = 'http://localhost:4173'
export const pdfUrl = `${baseUrl}/sample`

export async function launchWithExtension(channel: 'chromium' | 'msedge'): Promise<BrowserContext> {
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

export async function extensionIdOf(context: BrowserContext): Promise<string> {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
  return new URL(worker.url()).host
}

export function pdfFilter(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.documentElement).filter)
}

export async function expectDarkenedPdfPage(page: Page): Promise<void> {
  await page.goto(pdfUrl)
  expect(await page.evaluate(() => document.contentType)).toBe('application/pdf')
  await expect(page.locator('#lightswitch-pdf-style')).toHaveCount(1)
  const filter = await pdfFilter(page)
  expect(filter).toContain('invert')
  expect(filter).toContain('hue-rotate(180deg)')
}
