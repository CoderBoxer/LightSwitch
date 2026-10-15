# LightSwitch

[![CI](https://github.com/CoderBoxer/LightSwitch/actions/workflows/ci.yml/badge.svg)](https://github.com/CoderBoxer/LightSwitch/actions/workflows/ci.yml)

Dark mode for PDFs in Chrome and Edge.

Chrome and Edge can darken their own UI, but a PDF always renders as a white page and neither browser gives you a setting to change that. LightSwitch fixes the page itself, without touching the file: text becomes light on a dark background, so a lecture PDF at night is readable instead of painful.

Early development: PDFs are covered, website dark mode comes later.

## What works today

- PDFs opened from the web
- Local PDFs opened with `file://` (requires "Allow access to file URLs" on the extension's details page)
- PDFs embedded with `<embed>` / `<object>`, including viewers that are added to the page after it has loaded
- PDFs inline in an `<iframe>`
- Three themes — Soft, Black and Sepia — plus brightness and contrast sliders in the popup
- `Alt+Shift+D` toggles the theme on and off

## How it works

A PDF is drawn by the browser's built-in viewer, not by HTML, so there is nothing on the page to restyle and the viewer itself is out of reach. The way in is a CSS filter on the document root:

```css
html { filter: invert(1) hue-rotate(180deg) brightness(0.9); }
```

Inverting turns the white page near-black and the text light. `hue-rotate(180deg)` runs after the inversion so colours come back as themselves instead of complements — a graph that was red stays red-ish rather than turning cyan.

An embedded PDF is the opposite case: the filter has to go on the `<embed>` element only, or the rest of the page would invert with it. Which case applies is decided by `document.contentType`, not by looking for viewer elements. That distinction matters: when you open a PDF straight from the web, the viewer lives in a separate frame and element-based detection matches nothing, which is why a lot of PDF dark mode extensions quietly do nothing on web PDFs.

## Limitations

- Photos and diagrams invert along with the text. A filter cannot tell a photo from a paragraph; nothing short of re-rendering the PDF can leave images untouched.
- Google Drive's PDF viewer isn't covered.
- DRM-protected documents can't be touched by any extension.
- Local files need "Allow access to file URLs" enabled.

## Development

```bash
npm install
npm run build   # builds into dist/
```

Load the result via `chrome://extensions` (or `edge://extensions`) → Developer mode → Load unpacked → select `dist/`.

```bash
npm test          # unit tests
npm run typecheck
npm run test:e2e  # browser tests; run `npx playwright install chromium` once first
npm run icons     # regenerates the PNG icons from scripts/make-icons.mjs
npm run package   # builds and writes release/lightswitch-<version>.zip
```

The zip in `release/` is the artifact to upload to the Chrome Web Store and Edge Add-ons.

## License

MIT © Shadman Ahmmed
