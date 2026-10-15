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

function watchForPdfEmbeds(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue
        if (!node.matches(PDF_EMBED_SELECTOR) && !node.querySelector(PDF_EMBED_SELECTOR)) continue
        void apply()
        return
      }
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

if (!isPdfDocument(document.contentType)) {
  watchForPdfEmbeds()
}

void apply()
document.addEventListener('DOMContentLoaded', apply)
chrome.storage.onChanged.addListener(() => void apply())
