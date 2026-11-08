import type { ActionTree } from 'vuex'
import { Globals } from '@/globals'
import type { ConsoleEntry, ConsoleFilter, ConsoleState, GlobalTouchOffsetModel, M191Setting, MaterialZOffset, PromptDialogButton, PromptDialogItemButton, PromptDialogItemText } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import DOMPurify from 'dompurify'
import { parsePrTouchGlobalAction } from '@/util/prtouch-global-offsets'
import { takeRightWhile } from 'lodash-es'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits known command history
   */
  async initConsole ({ commit }, payload: Partial<ConsoleState>) {
    commit('setInitConsole', payload)
  },

  /**
   * Add a command history item, and update server store.
   */
  async onUpdateCommandHistory ({ state, commit }, payload: string[]) {
    commit('setUpdateCommandHistory', payload)
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.commandHistory', state.commandHistory)
  },

  /**
   * The result of a specific gcode request.
   */
  async onGcodeScript ({ dispatch }, payload: { result?: string }) {
    // If the response is not ok, pass it to the console.
    if (payload && payload.result && payload.result !== 'ok') {
      dispatch('onAddConsoleEntry', { message: Globals.CONSOLE_RECEIVE_PREFIX + payload.result })
    }
  },

  /**
   * Add a console entry
   */
  async onAddConsoleEntry ({ commit, dispatch }, payload: Omit<ConsoleEntry, 'id'>) {
    payload.message = DOMPurify.sanitize(payload.message).replace(/\r\n|\r|\n/g, '<br />')
    if (!payload.time || payload.time <= 0) {
      payload.time = Date.now() / 1000 | 0
    }
    if (!payload.type) {
      payload.type = 'response'
    }
    if (payload.type === 'response' && payload.message.startsWith('// action:')) {
      payload.type = 'action'
    }

    commit('setConsoleEntry', payload)

    dispatch('onUpdatePromptDialog', payload)
    dispatch('onUpdateGlobalTouchOffsetsDialog', payload)
    dispatch('onUpdateGlobalPrTouchOffsetsDialog', payload)
    dispatch('onUpdateMaterialZOffsetsDialog', payload)
    dispatch('onUpdateM191SettingsDialog', payload)
  },

  /**
   * On a fresh load of the UI, we load prior gcode / console history
   */
  async onGcodeStore ({ commit, dispatch }, payload: Moonraker.DataStore.GcodeStoreResponse) {
    if (payload && payload.gcode_store) {
      const entries = payload.gcode_store
        .map((entry, index): ConsoleEntry => {
          const rawMessage = Globals.CONSOLE_RECEIVE_PREFIX + entry.message
          const message = DOMPurify.sanitize(rawMessage)
            .replace(/\r\n|\r|\n/g, '<br />')

          const type = (
            entry.type === 'response' &&
            entry.message.startsWith('// action:')
          )
            ? 'action'
            : entry.type

          return {
            ...entry,
            id: index,
            message,
            type
          }
        })

      commit('setAllEntries', entries)

      const dialogEntries = entries
        .filter(entry => (
          entry.type === 'action' &&
          entry.message.startsWith('// action:prompt_')
        ))

      const dialogEntriesAfterEnd = takeRightWhile(dialogEntries, entry => entry.message !== '// action:prompt_end')
      const dialogEntriesAfterBegin = takeRightWhile(dialogEntriesAfterEnd, entry => entry.message !== '// action:prompt_begin')

      dialogEntriesAfterBegin
        .forEach(entry => dispatch('onUpdatePromptDialog', entry))
    }
  },

  async onUpdatePromptDialog ({ commit }, payload: ConsoleEntry) {
    const parsedMessage = (
      payload.type === 'action' &&
      /^\/\/ action:prompt_([^ ]+)(?: (.+))?/.exec(payload.message)
    )

    if (parsedMessage) {
      const [, type, param] = parsedMessage

      switch (type) {
        case 'begin':
          commit('setResetPromptDialog', param)
          break

        case 'text': {
          const item: PromptDialogItemText = {
            type: 'text',
            text: param
          }

          commit('setPromptDialogItem', item)
          break
        }

        case 'button': {
          const [text, command, color] = param.split('|')

          const item: PromptDialogItemButton = {
            type: 'button',
            text,
            command,
            color
          }

          commit('setPromptDialogItem', item)
          break
        }

        case 'footer_button': {
          const [text, command, color] = param.split('|')

          const item: PromptDialogButton = {
            text,
            command,
            color
          }

          commit('setPromptDialogFooterButton', item)

          break
        }

        case 'show':
        case 'end':
          commit('setPromptDialogOpen', type === 'show')
      }
    }
  },

  async onUpdateGlobalPrTouchOffsetsDialog ({ commit }, payload: ConsoleEntry) {
    if (payload.type !== 'action') return
    const action = parsePrTouchGlobalAction(payload.message)
    if (!action) return
    switch (action.type) {
      case 'begin':
        commit('setBeginGlobalPrTouchOffsetsDialog', action)
        break
      case 'surface':
        commit('setGlobalPrTouchSurface', action.surface)
        break
      case 'show':
      case 'end':
        commit('setGlobalPrTouchOffsetsDialogOpen', action.type === 'show')
        break
    }
  },

  async onUpdateGlobalTouchOffsetsDialog ({ commit }, payload: ConsoleEntry) {
    const parsedMessage = (
      payload.type === 'action' &&
      /^\/\/ action:global_carto_offsets_([^ ]+)(?: (.+))?/.exec(payload.message)
    )

    if (!parsedMessage) return

    const [, type, param] = parsedMessage
    switch (type) {
      case 'begin':
        commit('setResetGlobalTouchOffsetsDialog')
        if (param === 'touch' || param === 'scan') {
          commit('setGlobalTouchOffsetsDialogMode', param)
        }
        break

      case 'model': {
        if (!param) return
        const [name, valueText, indexText] = param.split('|')
        const value = Number(valueText)
        const index = Number(indexText)
        if (name && Number.isFinite(value) && Number.isInteger(index) && index >= 0) {
          const model: GlobalTouchOffsetModel = { name, value, index }
          commit('setGlobalTouchOffsetModel', model)
        }
        break
      }

      case 'show':
      case 'end':
        commit('setGlobalTouchOffsetsDialogOpen', type === 'show')
        break
    }
  },

  async onUpdateMaterialZOffsetsDialog ({ commit }, payload: ConsoleEntry) {
    const parsedMessage = (
      payload.type === 'action' &&
      /^\/\/ action:material_z_offsets_([^ ]+)(?: (.+))?/.exec(payload.message)
    )

    if (!parsedMessage) return

    const [, type, param] = parsedMessage
    switch (type) {
      case 'begin':
        commit('setResetMaterialZOffsetsDialog')
        break

      case 'material': {
        if (!param) return
        const [name, valueText, indexText] = param.split('|')
        const value = Number(valueText)
        const index = Number(indexText)
        if (name && Number.isFinite(value) && Number.isInteger(index) && index >= 0) {
          const material: MaterialZOffset = { name, value, index }
          commit('setMaterialZOffset', material)
        }
        break
      }

      case 'show':
      case 'end':
        commit('setMaterialZOffsetsDialogOpen', type === 'show')
        break
    }
  },

  async onUpdateM191SettingsDialog ({ commit }, payload: ConsoleEntry) {
    const parsedMessage = (
      payload.type === 'action' &&
      /^\/\/ action:m191_settings_([^ ]+)(?: (.+))?/.exec(payload.message)
    )

    if (!parsedMessage) return

    const [, type, param] = parsedMessage
    switch (type) {
      case 'begin':
        commit('setResetM191SettingsDialog')
        break

      case 'setting': {
        if (!param) return
        const [key, label, valueText, minimumText, maximumText, unit, indexText, kind, exclusiveText] = param.split('|')
        const value = Number(valueText)
        const minimum = Number(minimumText)
        const maximum = Number(maximumText)
        const index = Number(indexText)
        if (
          key && label && Number.isFinite(value) && Number.isFinite(minimum) &&
          Number.isFinite(maximum) && Number.isInteger(index) && index >= 0 &&
          (kind === 'number' || kind === 'boolean')
        ) {
          const setting: M191Setting = {
            key,
            label,
            value,
            minimum,
            maximum,
            unit,
            index,
            kind,
            exclusiveMinimum: exclusiveText === '1'
          }
          commit('setM191Setting', setting)
        }
        break
      }

      case 'show':
      case 'end':
        commit('setM191SettingsDialogOpen', type === 'show')
        break
    }
  },

  /**
   * Klipper provides us with a list of available gcode commands
   * based on the current configuration.
   */
  async onGcodeHelp ({ commit }, payload: Moonraker.KlippyApis.GcodeHelpResponse) {
    commit('setGcodeHelp', payload)
  },

  /**
   * Updates auto scroll value
   */
  async onUpdateAutoScroll ({ commit }, payload: boolean) {
    commit('setAutoScroll', payload)
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.autoScroll', payload)
  },

  /**
   * Remove a filter
   */
  async onRemoveFilter ({ commit, state }, filter: ConsoleFilter) {
    commit('setRemoveFilter', filter)
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.consoleFilters', state.consoleFilters)
  },

  /**
    * Add/Edit a filter
    */
  async onSaveFilter ({ commit, state }, filter: ConsoleFilter) {
    commit('setFilter', filter)
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.consoleFilters', state.consoleFilters)
  },

  async onClear ({ commit, state }) {
    commit('setLastCleared')
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.lastCleared', state.lastCleared)
  }
} satisfies ActionTree<ConsoleState, RootState>
