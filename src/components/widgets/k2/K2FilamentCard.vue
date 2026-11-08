<template>
  <collapsable-card
    :title="$t('app.k2.title.filament')"
    icon="$filament"
    draggable
    layout-path="dashboard.k2-filament-card"
  >
    <v-card-text>
      <v-alert
        v-if="!deviceReady"
        dense
        text
        type="info"
      >
        {{ $t('app.k2.msg.unavailable') }}
      </v-alert>
      <div
        v-if="deviceReady"
        class="k2-slots"
      >
        <button
          v-for="slot in device.slots"
          :key="slotKey(slot)"
          type="button"
          class="k2-slot pa-3"
          :class="{ 'k2-selected': selected === slotKey(slot) }"
          :aria-pressed="selected === slotKey(slot)"
          :disabled="sending || !slot.occupied"
          @click="selected = slotKey(slot)"
        >
          <span class="d-block mb-2">{{ slot.external ? $t('app.k2.label.external') : slot.label }}</span>
          <span
            class="k2-spool"
            :style="{ backgroundColor: slot.color }"
          ><span /></span>
          <strong class="d-block mt-2">{{ slot.material || $t('app.k2.label.empty') }}</strong>
          <span
            v-if="slot.name"
            class="d-block text-caption"
          >{{ slot.name }}</span>
          <span
            v-if="slot.percent !== null"
            class="d-block text-caption"
          >{{ slot.percent }}%</span>
        </button>
      </div>
      <div
        v-if="deviceReady && !device.slots.length"
        class="mb-3"
      >
        {{ $t('app.k2.msg.no_slots') }}
      </div>
      <div
        class="mt-3 mb-3"
        role="status"
      >
        {{ $t(device.pending ? 'app.k2.msg.pending' : 'app.k2.msg.select_slot') }}
      </div>
      <div
        v-if="deviceReady && device.auto_refill !== null"
        class="text-caption mb-3"
      >
        {{ $t('app.k2.label.auto_refill') }}:
        {{ $t(device.auto_refill ? 'app.general.label.on' : 'app.general.label.off') }}
      </div>
      <div class="d-flex flex-wrap align-center k2-footer">
        <div>
          <app-btn
            :disabled="!canMove"
            :loading="sending"
            @click="move('feed')"
          >
            {{ $t('app.k2.btn.feed') }}
          </app-btn>
          <app-btn
            class="ml-2"
            :disabled="!canMove"
            :loading="sending"
            @click="move('retract')"
          >
            {{ $t('app.k2.btn.retract') }}
          </app-btn>
        </div>
        <div
          v-if="deviceReady && humidities.length"
          class="d-flex flex-wrap justify-end ml-auto k2-humidities"
        >
          <span
            v-for="box in humidities"
            :key="box.id"
            class="k2-humidity text-caption"
          >
            <span v-if="humidities.length > 1">CFS {{ box.id }} · </span>
            {{ $t('app.k2.label.humidity') }} {{ box.value }}%
          </span>
        </div>
      </div>
      <div
        v-if="deviceReady && !device.can_feed && !device.pending"
        class="text-caption mt-3"
      >
        {{ $t('app.k2.msg.busy') }}
      </div>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import K2DeviceMixin from '@/mixins/k2-device'
import { SocketActions } from '@/api/socketActions'
import type { K2Slot } from '@/store/k2Device/types'
import { getCfsHumidity } from '@/util/k2-humidity'

@Component
export default class K2FilamentCard extends Mixins(K2DeviceMixin) {
  selected = ''

  get humidities () {
    return getCfsHumidity(this.device.slots)
  }

  slotKey (slot: K2Slot) {
    return `${slot.box_id}:${slot.slot_id}`
  }

  get selectedSlot () {
    return this.device.slots.find(slot => this.slotKey(slot) === this.selected && slot.occupied)
  }

  get canMove () {
    return this.deviceReady && this.device.can_feed && !this.sending && !!this.selectedSlot &&
      !this.printerPrinting && !this.printerPaused
  }

  @Watch('deviceReady')
  onReadyChange () {
    this.selected = ''
  }

  @Watch('device.slots')
  onSlotsChange () {
    if (!this.selectedSlot) this.selected = ''
  }

  move (action: 'feed' | 'retract') {
    const slot = this.selectedSlot
    if (!this.canMove || !slot) return
    return this.sendDeviceCommand(() => SocketActions.serverK2DeviceFilament(
      slot.box_id, slot.slot_id, action
    ))
  }
}
</script>

<style scoped>
.k2-slots { display: flex; flex-wrap: wrap; gap: 12px; }
.k2-footer { gap: 12px; }
.k2-humidities { gap: 8px; }
.k2-humidity { padding: 4px 10px; border: 1px solid rgba(128, 128, 128, .3); border-radius: 4px; }
.k2-slot { color: inherit; flex: 1 1 90px; border: 2px solid rgba(128, 128, 128, .3); border-radius: 8px; overflow-wrap: anywhere; }
.k2-slot:disabled { opacity: .5; }
.k2-slot:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.k2-selected { border-color: var(--v-primary-base); }
.k2-spool { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; border: 2px solid #999; }
.k2-spool span { width: 18px; height: 18px; border-radius: 50%; background: #333; }
</style>
