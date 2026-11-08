<template>
  <app-dialog
    v-model="open"
    :title="mode === 'scan' ? 'Global Carto Scan Z Offsets' : 'Global Carto Touch Z Offsets'"
    cancel-button-text="Cancel"
    save-button-text="Save"
    max-width="450"
    @cancel="cancel"
    @save="save"
  >
    <v-card-text>
      <div class="text-body-2 mb-3">
        Select a {{ mode === 'scan' ? 'Scan' : 'Touch' }} model and increment. Bed down makes the offset more negative.
      </div>

      <v-row
        v-for="model in models"
        :key="model.index"
        dense
      >
        <v-col>
          <app-btn
            :color="selectedModelIndex === model.index ? 'primary' : undefined"
            :outlined="selectedModelIndex !== model.index"
            block
            class="model-button"
            @click="selectedModelIndex = model.index"
          >
            <span>{{ model.name }}</span>
            <v-spacer />
            <span>{{ formatOffset(workingOffsets[model.index]) }} mm</span>
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
            @click="moveBedUp"
          >
            Bed up / closer
          </app-btn>
        </v-col>
        <v-col>
          <app-btn
            color="secondary"
            block
            @click="moveBedDown"
          >
            Bed down / farther
          </app-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { GlobalTouchOffsetModel } from '@/store/console/types'
import { adjustCartographerOffset, buildTouchOffsetSaveCommands } from '@/util/global-touch-offsets'

@Component({})
export default class GlobalTouchOffsetsDialog extends Mixins(StateMixin) {
  readonly increments = [0.005, 0.01, 0.025, 0.05]
  selectedIncrement = 0.01
  selectedModelIndex = 0
  workingOffsets: Record<number, number> = {}

  get dialog () {
    return this.$typedState.console.globalTouchOffsetsDialog
  }

  get models (): GlobalTouchOffsetModel[] {
    return this.dialog.models
  }

  get mode (): 'touch' | 'scan' {
    return this.dialog.mode
  }

  get open (): boolean {
    return this.dialog.open
  }

  set open (value: boolean) {
    if (!value) this.cancel()
  }

  @Watch('dialog.open')
  onDialogOpen (open: boolean) {
    if (!open || this.models.length === 0) return

    this.workingOffsets = {}
    this.models.forEach(model => {
      Vue.set(this.workingOffsets, model.index, model.value)
    })
    this.selectedModelIndex = this.models[0].index
    this.selectedIncrement = 0.01
  }

  formatOffset (value: number): string {
    return Number(value).toFixed(3)
  }

  moveBedUp () {
    this.adjustSelected(this.selectedIncrement)
  }

  moveBedDown () {
    this.adjustSelected(-this.selectedIncrement)
  }

  adjustSelected (delta: number) {
    const value = this.workingOffsets[this.selectedModelIndex]
    if (value === undefined) return
    Vue.set(
      this.workingOffsets,
      this.selectedModelIndex,
      adjustCartographerOffset(value, delta)
    )
  }

  cancel () {
    this.sendGcode('K2_CARTOGRAPHER_GLOBAL_Z_CANCEL')
  }

  save () {
    const commands = buildTouchOffsetSaveCommands(this.models, this.workingOffsets)
    this.sendGcode(commands.join('\n'))
  }
}
</script>

<style lang="scss" scoped>
.model-button {
  text-transform: none;
}
</style>
