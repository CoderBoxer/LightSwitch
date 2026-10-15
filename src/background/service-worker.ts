const TOGGLE_COMMAND = 'toggle'

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== TOGGLE_COMMAND) return
  const { enabled } = (await chrome.storage.sync.get({ enabled: true })) as { enabled: boolean }
  await chrome.storage.sync.set({ enabled: !enabled })
})
