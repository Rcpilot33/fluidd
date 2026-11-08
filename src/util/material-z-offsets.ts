interface MaterialOffset {
  index: number;
  value: number;
}

export const adjustMaterialOffset = (value: number, delta: number): number => {
  const adjusted = Math.round((value + delta) * 1000) / 1000
  return Math.max(-5, Math.min(5, adjusted))
}

export const buildMaterialOffsetSaveCommands = (
  materials: MaterialOffset[],
  workingOffsets: Record<number, number>
): string[] => {
  const commands = materials
    .filter(material => workingOffsets[material.index] !== material.value)
    .map(material => (
      `K2_MATERIAL_Z_STAGE INDEX=${material.index} ` +
      `VALUE=${workingOffsets[material.index].toFixed(3)}`
    ))

  commands.push('K2_MATERIAL_Z_SAVE')
  return commands
}
