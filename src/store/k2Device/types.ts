export type K2Fan = 'model' | 'case' | 'side'

export interface K2Slot {
  box_id: number;
  slot_id: number;
  external: boolean;
  label: string;
  material: string;
  name: string;
  color: string;
  occupied: boolean;
  percent: number | null;
  humidity: number | null;
}

export interface K2DeviceStatus {
  connected: boolean;
  fans: Record<K2Fan, number | null>;
  slots: K2Slot[];
  can_feed: boolean;
  pending: boolean;
  feed_state: number | null;
  auto_refill: boolean | null;
}

export interface K2DeviceState {
  status: K2DeviceStatus;
  receivedAt: number;
}
