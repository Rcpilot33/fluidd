<template>
  <collapsable-card
    :title="$t('app.k2.title.fans')"
    icon="$motion"
    draggable
    layout-path="dashboard.k2-fans-card"
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
      <div class="k2-fans">
        <div
          v-for="fan in fans"
          :key="fan.id"
          class="k2-fan pa-3"
        >
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-1">{{ $t(`app.k2.label.${fan.id}_fan`) }}</span>
            <v-switch
              :input-value="(device.fans[fan.id] || 0) > 0"
              :aria-label="$t(`app.k2.label.${fan.id}_fan`)"
              :disabled="!deviceReady || sending || device.fans[fan.id] === null"
              hide-details
              class="mt-0 pt-0 ml-2"
              @change="setSpeed(fan.id, $event ? 100 : 0)"
            />
          </div>
          <div class="mt-2 mb-1">
            {{ $t('app.k2.label.speed') }}:
            {{ deviceReady && device.fans[fan.id] !== null ? `${device.fans[fan.id]}%` : '—' }}
          </div>
          <v-slider
            :value="device.fans[fan.id] || 0"
            :aria-label="$t(`app.k2.label.${fan.id}_fan`)"
            :disabled="!deviceReady || sending || device.fans[fan.id] === null"
            min="0"
            max="100"
            step="1"
            thumb-label
            hide-details
            @change="setSpeed(fan.id, $event)"
          />
        </div>
      </div>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import K2DeviceMixin from '@/mixins/k2-device'
import { SocketActions } from '@/api/socketActions'
import type { K2Fan } from '@/store/k2Device/types'

@Component
export default class K2FansCard extends Mixins(K2DeviceMixin) {
  fans: { id: K2Fan }[] = [{ id: 'model' }, { id: 'case' }, { id: 'side' }]

  setSpeed (fan: K2Fan, speed: number) {
    return this.sendDeviceCommand(() => SocketActions.serverK2DeviceFan(fan, speed))
  }
}
</script>

<style scoped>
.k2-fans { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.k2-fan { border: 1px solid rgba(128, 128, 128, .3); border-radius: 8px; }
</style>
