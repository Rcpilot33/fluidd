<template>
  <app-dialog
    v-model="open"
    title="Global No-Carto Z Offsets"
    cancel-button-text="Cancel"
    save-button-text="Save"
    max-width="450"
    @cancel="cancel"
    @save="save"
  >
    <v-card-text>
      <div class="text-body-2 mb-3">
        Select an offset and increment. Bed down makes the offset more negative.
        These controls edit saved values, not live bed position.
      </div>

      <v-row
        v-for="surface in dialog.surfaces"
        :key="surface.index"
        dense
      >
        <v-col>
          <app-btn
            :color="dialog.selectedIndex === surface.index ? 'primary' : undefined"
            :outlined="dialog.selectedIndex !== surface.index"
            block
            class="surface-button"
            @click="selectSurface(surface.index)"
          >
            <span class="surface-name">{{ surface.name }}{{ surface.inherited ? ' (default)' : '' }}</span>
            <v-spacer />
            <span class="offset-value">{{ surface.value.toFixed(3) }} mm</span>
          </app-btn>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col>
          <app-btn-toggle
            v-model="selectedIncrement"
            mandatory
            class="d-flex"
          >
            <app-btn
              v-for="increment in increments"
              :key="increment"
              :value="increment"
              class="flex-grow-1"
              small
            >
              {{ increment.toFixed(3) }}
            </app-btn>
          </app-btn-toggle>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col>
          <app-btn
            color="primary"
            block
            @click="adjust('up')"
          >
            Bed up / closer
          </app-btn>
        </v-col>
        <v-col>
          <app-btn
            color="secondary"
            block
            @click="adjust('down')"
          >
            Bed down / farther
          </app-btn>
        </v-col>
      </v-row>

      <v-row
        v-if="selectedSurface && selectedSurface.name !== 'DEFAULT'"
        dense
      >
        <v-col>
          <app-btn
            block
            outlined
            @click="inherit"
          >
            Use DEFAULT
          </app-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class GlobalPrTouchOffsetsDialog extends Mixins(StateMixin) {
  readonly increments = [0.005, 0.010, 0.025, 0.050]

  get dialog () {
    return this.$typedState.console.globalPrTouchOffsetsDialog
  }

  get selectedSurface () {
    return this.dialog.surfaces.find(surface => surface.index === this.dialog.selectedIndex)
  }

  get open (): boolean {
    return this.dialog.open
  }

  set open (value: boolean) {
    if (!value) this.cancel()
  }

  get selectedIncrement (): number {
    return this.dialog.increment
  }

  set selectedIncrement (value: number) {
    if (this.increments.includes(value) && value !== this.dialog.increment) {
      this.sendGcode(`K2_PRTOUCH_GLOBAL_Z_STEP VALUE=${value.toFixed(3)}`)
    }
  }

  selectSurface (index: number) {
    this.sendGcode(`K2_PRTOUCH_GLOBAL_Z_SELECT INDEX=${index}`)
  }

  adjust (direction: 'up' | 'down') {
    this.sendGcode(`K2_PRTOUCH_GLOBAL_Z_ADJUST DIRECTION=${direction}`)
  }

  inherit () {
    this.sendGcode('K2_PRTOUCH_GLOBAL_Z_INHERIT')
  }

  cancel () {
    this.sendGcode('K2_PRTOUCH_GLOBAL_Z_CANCEL')
  }

  save () {
    this.sendGcode('K2_PRTOUCH_GLOBAL_Z_SAVE')
  }
}
</script>

<style lang="scss" scoped>
.surface-button {
  text-transform: none;
}
.surface-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.offset-value {
  flex-shrink: 0;
  margin-left: 8px;
}
</style>
