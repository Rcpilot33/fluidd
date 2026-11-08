<template>
  <app-dialog
    v-model="open"
    title="Material Z Offsets"
    cancel-button-text="Cancel"
    save-button-text="Save"
    max-width="450"
    @cancel="cancel"
    @save="save"
  >
    <v-card-text>
      <div class="text-body-2 mb-3">
        Bed up / closer makes the material offset more negative. Bed down / farther makes it more positive.
      </div>

      <v-row
        v-for="material in materials"
        :key="material.index"
        dense
      >
        <v-col>
          <app-btn
            :color="selectedMaterialIndex === material.index ? 'primary' : undefined"
            :outlined="selectedMaterialIndex !== material.index"
            block
            class="material-button"
            @click="selectedMaterialIndex = material.index"
          >
            <span>{{ material.name }}</span>
            <v-spacer />
            <span>{{ formatOffset(workingOffsets[material.index]) }} mm</span>
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
              class="flex-grow-1 px-1"
              small
            >
              {{ increment.toFixed(3) }}
            </app-btn>
          </app-btn-toggle>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col
          cols="12"
          sm="6"
        >
          <app-btn
            color="primary"
            block
            @click="moveBedUp"
          >
            Bed up / closer
          </app-btn>
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
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
import type { MaterialZOffset } from '@/store/console/types'
import { adjustMaterialOffset, buildMaterialOffsetSaveCommands } from '@/util/material-z-offsets'

@Component({})
export default class MaterialZOffsetsDialog extends Mixins(StateMixin) {
  readonly increments = [0.005, 0.01, 0.025, 0.05]
  selectedIncrement = 0.01
  selectedMaterialIndex = 0
  workingOffsets: Record<number, number> = {}

  get dialog () {
    return this.$typedState.console.materialZOffsetsDialog
  }

  get materials (): MaterialZOffset[] {
    return this.dialog.materials
  }

  get open (): boolean {
    return this.dialog.open
  }

  set open (value: boolean) {
    if (!value) this.cancel()
  }

  @Watch('dialog.open')
  onDialogOpen (open: boolean) {
    if (!open || this.materials.length === 0) return

    this.workingOffsets = {}
    this.materials.forEach(material => {
      Vue.set(this.workingOffsets, material.index, material.value)
    })
    this.selectedMaterialIndex = this.materials[0].index
    this.selectedIncrement = 0.01
  }

  formatOffset (value: number): string {
    return Number(value).toFixed(3)
  }

  moveBedUp () {
    this.adjustSelected(-this.selectedIncrement)
  }

  moveBedDown () {
    this.adjustSelected(this.selectedIncrement)
  }

  adjustSelected (delta: number) {
    const value = this.workingOffsets[this.selectedMaterialIndex]
    if (value === undefined) return
    Vue.set(
      this.workingOffsets,
      this.selectedMaterialIndex,
      adjustMaterialOffset(value, delta)
    )
  }

  cancel () {
    this.sendGcode('K2_MATERIAL_Z_CANCEL')
  }

  save () {
    const commands = buildMaterialOffsetSaveCommands(this.materials, this.workingOffsets)
    this.sendGcode(commands.join('\n'))
  }
}
</script>

<style lang="scss" scoped>
.material-button {
  text-transform: none;
}
</style>
