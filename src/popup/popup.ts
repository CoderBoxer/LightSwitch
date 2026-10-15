import type { Preset } from '../core/pdf'
import { loadSettings, saveSettings, type Settings } from '../shared/settings'

const enabled = getElement<HTMLInputElement>('enabled')
const presets = getElement<HTMLElement>('presets')
const brightness = getElement<HTMLInputElement>('brightness')
const contrast = getElement<HTMLInputElement>('contrast')
const brightnessValue = getElement<HTMLOutputElement>('brightness-value')
const contrastValue = getElement<HTMLOutputElement>('contrast-value')

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) throw new Error(`missing #${id}`)
  return element as T
}

function render(settings: Settings): void {
  enabled.checked = settings.enabled
  document.body.classList.toggle('off', !settings.enabled)
  brightness.value = String(Math.round(settings.brightness * 100))
  contrast.value = String(Math.round(settings.contrast * 100))
  markPreset(settings.preset)
  renderSliderValues()
}

function markPreset(preset: Preset): void {
  for (const button of presets.querySelectorAll('button')) {
    button.classList.toggle('active', button.dataset.preset === preset)
  }
}

function renderSliderValues(): void {
  brightnessValue.textContent = `${brightness.value}%`
  contrastValue.textContent = `${contrast.value}%`
}

function debounce(fn: () => void, delay: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return () => {
    clearTimeout(timer)
    timer = setTimeout(fn, delay)
  }
}

const saveSliders = debounce(() => {
  void saveSettings({
    brightness: Number(brightness.value) / 100,
    contrast: Number(contrast.value) / 100,
  })
}, 250)

enabled.addEventListener('change', () => {
  document.body.classList.toggle('off', !enabled.checked)
  void saveSettings({ enabled: enabled.checked })
})

presets.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest('button[data-preset]')
  if (!(button instanceof HTMLButtonElement)) return
  const preset = button.dataset.preset as Preset
  markPreset(preset)
  void saveSettings({ preset })
})

for (const slider of [brightness, contrast]) {
  slider.addEventListener('input', () => {
    renderSliderValues()
    saveSliders()
  })
}

void loadSettings().then(render)
