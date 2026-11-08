import type { ConsoleState } from './types'

export const defaultState = (): ConsoleState => {
  return {
    consoleCommand: '',
    consoleSearch: '',
    consoleEntryCount: 0,
    console: [],
    gcodeHelp: {},
    commandHistory: [],
    autoScroll: true,
    lastCleared: 0,
    promptDialog: {
      open: false,
      items: [],
      footerButtons: []
    },
    globalTouchOffsetsDialog: {
      open: false,
      mode: 'touch',
      models: []
    },
    globalPrTouchOffsetsDialog: {
      open: false,
      selectedIndex: 0,
      increment: 0.010,
      surfaces: []
    },
    materialZOffsetsDialog: {
      open: false,
      materials: []
    },
    m191SettingsDialog: {
      open: false,
      settings: []
    },
    consoleFilters: [],
    consoleFiltersRegexp: []
  }
}

export const state = defaultState()
