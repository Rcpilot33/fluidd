import { adjustCartographerOffset, buildTouchOffsetSaveCommands } from '../global-touch-offsets'

describe('global touch offsets', () => {
  it('moves up toward zero and prevents a positive touch offset', () => {
    expect(adjustCartographerOffset(-0.05, 0.025)).toBe(-0.025)
    expect(adjustCartographerOffset(-0.005, 0.01)).toBe(0)
  })

  it('moves down to a more-negative touch offset', () => {
    expect(adjustCartographerOffset(-0.05, -0.025)).toBe(-0.075)
  })

  it('keeps scan offsets non-positive within the backend range', () => {
    expect(adjustCartographerOffset(0, 0.025)).toBe(0)
    expect(adjustCartographerOffset(-0.3, -0.05)).toBe(-0.35)
    expect(adjustCartographerOffset(-4.99, -0.05)).toBe(-5)
  })

  it('stages only changed models before saving', () => {
    const models = [
      { index: 0, name: 'DEFAULT', value: -0.05 },
      { index: 1, name: 'TEXTURED_PEI', value: -0.06 }
    ]

    expect(buildTouchOffsetSaveCommands(models, { 0: -0.075, 1: -0.06 })).toEqual([
      'K2_CARTOGRAPHER_GLOBAL_Z_STAGE INDEX=0 VALUE=-0.075',
      'K2_CARTOGRAPHER_GLOBAL_Z_SAVE'
    ])
  })
})
