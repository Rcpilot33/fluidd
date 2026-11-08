import type { K2Slot } from '@/store/k2Device/types'

export const getCfsHumidity = (slots: K2Slot[]) => {
  const boxes = new Map<number, number>()
  for (const slot of slots) {
    if (!slot.external && slot.humidity !== null && !boxes.has(slot.box_id)) {
      boxes.set(slot.box_id, slot.humidity)
    }
  }
  return Array.from(boxes, ([id, value]) => ({ id, value }))
}
