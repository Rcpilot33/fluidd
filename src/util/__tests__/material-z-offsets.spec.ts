import { adjustMaterialOffset, buildMaterialOffsetSaveCommands } from '../material-z-offsets'

describe('material Z offsets', () => {
  it('moves closer in the negative direction and farther in the positive direction', () => {
    expect(adjustMaterialOffset(0.05, -0.01)).toBe(0.04)
    expect(adjustMaterialOffset(0.05, 0.025)).toBe(0.075)
  })

  it('limits values to the backend range', () => {
    expect(adjustMaterialOffset(-4.99, -0.05)).toBe(-5)
    expect(adjustMaterialOffset(4.99, 0.05)).toBe(5)
  })

  it('stages only changed rows and then saves', () => {
    const commands = buildMaterialOffsetSaveCommands(
      [{ index: 0, value: 0.05 }, { index: 1, value: -0.02 }],
      { 0: 0.075, 1: -0.02 }
    )
    expect(commands).toEqual([
      'K2_MATERIAL_Z_STAGE INDEX=0 VALUE=0.075',
      'K2_MATERIAL_Z_SAVE'
    ])
  })
})
