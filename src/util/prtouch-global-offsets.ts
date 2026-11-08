export interface GlobalPrTouchSurface {
  index: number;
  name: string;
  value: number;
  inherited: boolean;
}

export type PrTouchGlobalAction =
  | { type: 'begin'; selectedIndex: number; increment: number }
  | { type: 'surface'; surface: GlobalPrTouchSurface }
  | { type: 'show' | 'end' }

export const parsePrTouchGlobalAction = (message: string): PrTouchGlobalAction | undefined => {
  const parsed = /^\/\/ action:prtouch_global_offsets_([^ ]+)(?: (.+))?$/.exec(message)
  if (!parsed) return
  const [, type, param] = parsed
  if (type === 'show' || type === 'end') {
    if (param === undefined) return { type }
    return
  }
  const parts = param?.split('|') ?? []
  if (type === 'begin' && parts.length === 2 && parts.every(part => part.trim())) {
    const [selectedIndex, increment] = parts.map(Number)
    if (Number.isSafeInteger(selectedIndex) && selectedIndex >= 0 && [0.005, 0.010, 0.025, 0.050].includes(increment)) {
      return { type, selectedIndex, increment }
    }
  }
  if (type === 'surface' && parts.length === 4 && parts.every(part => part.trim())) {
    const [name, valueText, indexText, inheritedText] = parts
    const value = Number(valueText)
    const index = Number(indexText)
    if (/^[A-Z0-9_]{1,64}$/.test(name) && Number.isFinite(value) && Math.abs(value) <= 5 &&
        Number.isSafeInteger(index) && index >= 0 && ['0', '1'].includes(inheritedText)) {
      return { type, surface: { name, value, index, inherited: inheritedText === '1' } }
    }
  }
}
