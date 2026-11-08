import Vue from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import { Globals } from '@/globals'
import type { ConsoleEntry, ConsoleFilter, ConsoleState, GlobalTouchOffsetModel, M191Setting, MaterialZOffset, PromptDialogItemButton, PromptDialogItem } from './types'
import { escapeRegExp } from 'lodash-es'
import type { GlobalPrTouchSurface } from './types'

const compileExpression = (filter: ConsoleFilter): RegExp => {
  switch (filter.type) {
    case 'starts-with':
      return new RegExp(`^${escapeRegExp(filter.value)}.*`, 'i')
    case 'expression':
      return new RegExp(filter.value)
    default:
      return new RegExp(`.*${escapeRegExp(filter.value)}.*`, 'i')
  }
}

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Adds a console entry
   */
  setConsoleEntry (state, entry: ConsoleEntry) {
    if (entry.id === undefined) {
      state.consoleEntryCount++
      entry.id = state.consoleEntryCount
    }
    while (state.console.length >= Globals.CONSOLE_HISTORY_RETENTION) {
      state.console.shift()
    }
    state.console.push(Object.freeze(entry))
  },

  /**
   * Sets all console entries from moonraker store.
   */
  setAllEntries (state, payload: ConsoleEntry[]) {
    state.consoleEntryCount = payload.length
    state.console = payload
      .map(entry => Object.freeze(entry))
  },

  setResetPromptDialog (state, payload: string) {
    const { promptDialog } = defaultState()

    Object.assign(state, {
      promptDialog: {
        ...promptDialog,
        title: payload
      }
    })
  },

  setPromptDialogItem (state, payload: PromptDialogItem) {
    state.promptDialog.items.push(payload)
  },

  setPromptDialogFooterButton (state, payload: PromptDialogItemButton) {
    state.promptDialog.footerButtons.push(payload)
  },

  setPromptDialogOpen (state, payload: boolean) {
    state.promptDialog.open = payload
  },

  setBeginGlobalPrTouchOffsetsDialog (state, payload: { selectedIndex: number; increment: number }) {
    state.globalPrTouchOffsetsDialog = {
      open: state.globalPrTouchOffsetsDialog.open,
      selectedIndex: payload.selectedIndex,
      increment: payload.increment,
      surfaces: []
    }
  },

  setGlobalPrTouchSurface (state, payload: GlobalPrTouchSurface) {
    state.globalPrTouchOffsetsDialog.surfaces.push(payload)
  },

  setGlobalPrTouchOffsetsDialogOpen (state, payload: boolean) {
    state.globalPrTouchOffsetsDialog.open = payload
  },

  setResetGlobalTouchOffsetsDialog (state) {
    state.globalTouchOffsetsDialog = {
      open: false,
      mode: 'touch',
      models: []
    }
  },

  setGlobalTouchOffsetsDialogMode (state, payload: 'touch' | 'scan') {
    state.globalTouchOffsetsDialog.mode = payload
  },

  setGlobalTouchOffsetModel (state, payload: GlobalTouchOffsetModel) {
    state.globalTouchOffsetsDialog.models.push(payload)
  },

  setGlobalTouchOffsetsDialogOpen (state, payload: boolean) {
    state.globalTouchOffsetsDialog.open = payload
  },

  setResetMaterialZOffsetsDialog (state) {
    state.materialZOffsetsDialog = {
      open: false,
      materials: []
    }
  },

  setMaterialZOffset (state, payload: MaterialZOffset) {
    state.materialZOffsetsDialog.materials.push(payload)
  },

  setMaterialZOffsetsDialogOpen (state, payload: boolean) {
    state.materialZOffsetsDialog.open = payload
  },

  setResetM191SettingsDialog (state) {
    state.m191SettingsDialog = {
      open: false,
      settings: []
    }
  },

  setM191Setting (state, payload: M191Setting) {
    state.m191SettingsDialog.settings.push(payload)
  },

  setM191SettingsDialogOpen (state, payload: boolean) {
    state.m191SettingsDialog.open = payload
  },

  /**
   * Defines the list of available commands
   */
  setGcodeHelp (state, payload: Moonraker.KlippyApis.GcodeHelpResponse) {
    state.gcodeHelp = payload
  },

  /**
   * Inits the console history from db
   */
  setInitConsole (state, payload: Partial<ConsoleState>) {
    if (payload) {
      if (payload.consoleFilters) {
        payload.consoleFiltersRegexp = payload.consoleFilters
          .map(filter => {
            if (typeof filter.type === 'number') {
              switch (filter.type) {
                case 1:
                  filter.type = 'starts-with'
                  break

                case 2:
                  filter.type = 'expression'
                  break

                default:
                  filter.type = 'contains'
              }
            }

            return compileExpression(filter)
          })
      }
      Object.assign(state, payload)
    }
  },

  /**
   * Inits the console history from file
   */
  setUpdateCommandHistory (state, payload: string[]) {
    if (payload) {
      state.commandHistory = [...payload]
    }
  },

  /**
   * Maintains the current console command
   */
  setConsoleCommand (state, payload: string) {
    state.consoleCommand = payload
  },

  setConsoleSearch (state, payload: string) {
    state.consoleSearch = payload
  },

  /**
   * Sets auto scroll
   */
  setAutoScroll (state, payload: boolean) {
    state.autoScroll = payload
  },

  setFilter (state, filter: ConsoleFilter) {
    if (filter.id) {
      const i = state.consoleFilters.findIndex(c => c.id === filter.id)
      if (i >= 0) {
        const { type, value } = state.consoleFilters[i]

        Vue.set(state.consoleFilters, i, filter)

        if (type !== filter.type || value !== filter.value) {
          Vue.set(state.consoleFiltersRegexp, i, compileExpression(filter))
        }
      }
    } else {
      filter.id = uuidv4()
      state.consoleFilters.push(filter)
      state.consoleFiltersRegexp.push(compileExpression(filter))
    }
  },

  setRemoveFilter (state, filter: ConsoleFilter) {
    const i = state.consoleFilters.findIndex(c => c.id === filter.id)
    if (i >= 0) {
      state.consoleFilters.splice(i, 1)
      state.consoleFiltersRegexp.splice(i, 1)
    }
  },

  setLastCleared (state) {
    state.lastCleared = Date.now()
  }
} satisfies MutationTree<ConsoleState>
