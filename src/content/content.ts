import { buildPdfStyle, isPdfDocument, PDF_EMBED_SELECTOR, type PdfContext } from '../core/pdf'
import { loadSettings } from '../shared/settings'

const STYLE_ID = 'lightswitch-pdf-style'

function detectPdfContext(): PdfContext | null {
  if (isPdfDocument(document.contentType)) return 'top-level'
  if (document.querySelector(PDF_EMBED_SELECTOR)) return 'embedded'
  return null
}

async function apply() {
  const settings = await loadSettings()
  const context = detectPdfContext()
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null

  if (!context || !settings.enabled) {
    style?.remove()
    return
  }

  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    ;(document.head ?? document.documentElement).append(style)
  }
  style.textContent = buildPdfStyle(context, settings)
}

if (!isPdfDocument(document.contentType)) {
  const observer = new MutationObserver(() => {
    if (document.querySelector(PDF_EMBED_SELECTOR)) {
      observer.disconnect()
      void apply()
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

void apply()
document.addEventListener('DOMContentLoaded', apply)
chrome.storage.onChanged.addListener(() => void apply())
