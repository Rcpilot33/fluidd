import { getCfsHumidity } from '../k2-humidity'
import type { K2Slot } from '@/store/k2Device/types'

const slot = (boxId: number, slotId: number, humidity: number | null): K2Slot => ({
  box_id: boxId,
  slot_id: slotId,
  external: boxId === 0,
  label: `${boxId}${slotId}`,
  material: 'PLA',
  name: '',
  color: '#ff0000',
  occupied: true,
  percent: null,
  humidity
})

describe('CFS humidity readings', () => {
  it('keeps four independent unit readings and removes repeated per-slot values', () => {
    const slots = [slot(0, 0, 99), ...[1, 2, 3, 4].flatMap(boxId =>
      [0, 1, 2, 3].map(slotId => slot(boxId, slotId, 10 + boxId)))]
    expect(getCfsHumidity(slots)).toEqual([
      { id: 1, value: 11 }, { id: 2, value: 12 },
      { id: 3, value: 13 }, { id: 4, value: 14 }
    ])
  })

  it('preserves zero humidity and omits unavailable readings', () => {
    expect(getCfsHumidity([slot(1, 0, 0), slot(2, 0, null)])).toEqual([{ id: 1, value: 0 }])
    expect(getCfsHumidity([])).toEqual([])
  })
})
