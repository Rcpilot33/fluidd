interface TouchOffsetModel {
  index: number;
  value: number;
}

export const adjustCartographerOffset = (
  value: number,
  delta: number
): number => {
  const adjusted = Math.round((value + delta) * 1000) / 1000
  return Math.max(-5, Math.min(0, adjusted))
}

export const buildTouchOffsetSaveCommands = (
  models: TouchOffsetModel[],
  workingOffsets: Record<number, number>
): string[] => {
  const commands = models
    .filter(model => workingOffsets[model.index] !== model.value)
    .map(model => (
      `K2_CARTOGRAPHER_GLOBAL_Z_STAGE INDEX=${model.index} ` +
      `VALUE=${workingOffsets[model.index].toFixed(3)}`
    ))

  commands.push('K2_CARTOGRAPHER_GLOBAL_Z_SAVE')
  return commands
}
