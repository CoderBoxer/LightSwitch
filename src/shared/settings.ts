import type { Preset } from '../core/pdf'

export type Settings = {
  enabled: boolean
  preset: Preset
  brightness: number
  contrast: number
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  preset: 'soft',
  brightness: 1,
  contrast: 1,
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS)
  return { ...DEFAULT_SETTINGS, ...stored } as Settings
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch)
}
