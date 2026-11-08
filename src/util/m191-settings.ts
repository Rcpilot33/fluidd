export interface M191Setting {
  index: number;
  key: string;
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  unit: string;
  kind: 'number' | 'boolean';
  exclusiveMinimum: boolean;
}

export const adjustM191Setting = (
  setting: M191Setting,
  value: number,
  delta: number
): number => {
  if (setting.kind === 'boolean') return delta > 0 ? 1 : 0
  const lowerBound = setting.exclusiveMinimum
    ? Math.min(setting.minimum + 1, setting.maximum)
    : setting.minimum
  const adjusted = Math.round((value + delta) * 1000) / 1000
  return Math.max(lowerBound, Math.min(setting.maximum, adjusted))
}

export const buildM191SettingsSaveCommands = (
  settings: M191Setting[],
  workingValues: Record<number, number>
): string[] => {
  const commands = settings
    .filter(setting => workingValues[setting.index] !== setting.value)
    .map(setting => (
      `K2_M191_SETTINGS_STAGE INDEX=${setting.index} ` +
      `VALUE=${workingValues[setting.index]}`
    ))
  commands.push('K2_M191_SETTINGS_SAVE')
  return commands
}
