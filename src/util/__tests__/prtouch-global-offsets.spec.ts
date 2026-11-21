import { describe, expect, it } from 'vitest'
import { mutations } from '@/store/console/mutations'
import { defaultState } from '@/store/console/state'
import { parsePrTouchGlobalAction } from '../prtouch-global-offsets'

describe('separate no-Carto global offset action protocol', () => {
  it('parses selected surface and step', () => {
    expect(parsePrTouchGlobalAction('// action:prtouch_global_offsets_begin 2|0.005'))
      .toEqual({ type: 'begin', selectedIndex: 2, increment: 0.005 })
  })

  it('retains inheritance and all three decimal places', () => {
    expect(parsePrTouchGlobalAction('// action:prtouch_global_offsets_surface EPOXY|-0.025|1|1'))
      .toEqual({ type: 'surface', surface: { name: 'EPOXY', value: -0.025, index: 1, inherited: true } })
    expect(parsePrTouchGlobalAction('// action:prtouch_global_offsets_surface DEFAULT|-0.020|0|0'))
      .toEqual({ type: 'surface', surface: { name: 'DEFAULT', value: -0.020, index: 0, inherited: false } })
  })

  it('parses show and end', () => {
    expect(parsePrTouchGlobalAction('// action:prtouch_global_offsets_show')).toEqual({ type: 'show' })
    expect(parsePrTouchGlobalAction('// action:prtouch_global_offsets_end')).toEqual({ type: 'end' })
  })

  it('never consumes Cartographer, material, or generic prompt actions', () => {
    for (const message of ['// action:global_carto_offsets_begin touch', '// action:material_z_offsets_show', '// action:prompt_show']) {
      expect(parsePrTouchGlobalAction(message)).toBeUndefined()
    }
  })

  it('refuses invalid numeric data, command text, and incomplete messages', () => {
    for (const message of [
      'begin -1|0.010', 'begin 0|0.100', 'begin |0.010',
      'surface DEFAULT|NaN|0|0', 'surface DEFAULT|Infinity|0|0',
      'surface DEFAULT|5.001|0|0', 'surface DEFAULT|-0.020|0.1|0',
      'surface DEFAULT;-G28|-0.020|0|0', 'surface DEFAULT|-0.020|0|2',
      'surface DEFAULT||0|0', 'surface DEFAULT|-0.020|0', 'surface', 'show junk'
    ]) {
      expect(parsePrTouchGlobalAction(`// action:prtouch_global_offsets_${message}`)).toBeUndefined()
    }
  })
})

describe('no-Carto offset dialog refresh', () => {
  it('keeps the complete visible list and selection until the next show', () => {
    const state = defaultState()
    const base = { name: 'DEFAULT', index: 0, value: -0.070, inherited: false }
    const plate = { name: 'HIGH_TEMP', index: 1, value: -0.070, inherited: true }
    mutations.setBeginGlobalPrTouchOffsetsDialog(state, { selectedIndex: 0, increment: 0.010 })
    mutations.setGlobalPrTouchSurface(state, base)
    mutations.setGlobalPrTouchSurface(state, plate)
    expect(state.globalPrTouchOffsetsDialog.open).toBe(false)
    mutations.setGlobalPrTouchOffsetsDialogOpen(state, true)

    mutations.setBeginGlobalPrTouchOffsetsDialog(state, { selectedIndex: 1, increment: 0.005 })
    mutations.setGlobalPrTouchSurface(state, base)
    expect(state.globalPrTouchOffsetsDialog).toEqual({
      open: true, selectedIndex: 0, increment: 0.010, surfaces: [base, plate]
    })
    const adjusted = { ...plate, value: -0.065, inherited: false }
    mutations.setGlobalPrTouchSurface(state, adjusted)
    mutations.setGlobalPrTouchOffsetsDialogOpen(state, true)
    expect(state.globalPrTouchOffsetsDialog).toEqual({
      open: true, selectedIndex: 1, increment: 0.005, surfaces: [base, adjusted]
    })
  })

  it('discards an unfinished refresh on end and ignores stray rows and show', () => {
    const state = defaultState()
    mutations.setBeginGlobalPrTouchOffsetsDialog(state, { selectedIndex: 0, increment: 0.010 })
    mutations.setGlobalPrTouchOffsetsDialogOpen(state, false)
    mutations.setGlobalPrTouchSurface(state, { name: 'DEFAULT', index: 0, value: 0, inherited: false })
    mutations.setGlobalPrTouchOffsetsDialogOpen(state, true)
    expect(state.globalPrTouchOffsetsDialog.open).toBe(false)
    expect(state.globalPrTouchOffsetsDialog.surfaces).toEqual([])
  })
})
