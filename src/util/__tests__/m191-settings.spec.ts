import { adjustM191Setting, buildM191SettingsSaveCommands } from '../m191-settings'

const numeric = {
  index: 1,
  key: 'bed_assist_z_height',
  label: 'Bed Z Height',
  value: 195,
  minimum: 30,
  maximum: 330,
  unit: 'mm',
  kind: 'number' as const,
  exclusiveMinimum: false
}

describe('M191 settings', () => {
  it('adjusts and clamps numeric values', () => {
    expect(adjustM191Setting(numeric, 195, 10)).toBe(205)
    expect(adjustM191Setting(numeric, 325, 10)).toBe(330)
    expect(adjustM191Setting({ ...numeric, minimum: 0, exclusiveMinimum: true }, 5, -10)).toBe(1)
  })

  it('uses down and up as disable and enable for the boolean setting', () => {
    const setting = { ...numeric, kind: 'boolean' as const, minimum: 0, maximum: 1 }
    expect(adjustM191Setting(setting, 1, -10)).toBe(0)
    expect(adjustM191Setting(setting, 0, 10)).toBe(1)
  })

  it('stages only changed settings before saving', () => {
    const settings = [numeric, { ...numeric, index: 2, key: 'circulation_fan_speed', value: 25 }]
    expect(buildM191SettingsSaveCommands(settings, { 1: 205, 2: 25 })).toEqual([
      'K2_M191_SETTINGS_STAGE INDEX=1 VALUE=205',
      'K2_M191_SETTINGS_SAVE'
    ])
  })
})
