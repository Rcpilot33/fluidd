<template>
  <app-dialog
    v-model="open"
    title="Bed Assist"
    max-width="540"
    @cancel="cancel"
    @save="save"
  >
    <v-card-text class="settings-scroll-area py-3">
      <v-row
        v-for="setting in settings"
        :key="setting.index"
        dense
      >
        <v-col>
          <app-btn
            :color="selectedSettingIndex === setting.index ? 'primary' : undefined"
            :outlined="selectedSettingIndex !== setting.index"
            block
            class="setting-button py-2"
            @click="selectedSettingIndex = setting.index"
          >
            <span class="setting-label text-left">
              <span>{{ setting.label }}</span>
              <small
                v-if="setting.kind !== 'boolean'"
                class="d-block range-label"
              >
                {{ formatRange(setting) }}
              </small>
            </span>
            <v-spacer />
            <span>{{ formatValue(setting, workingValues[setting.index]) }}</span>
          </app-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <template #actions>
      <div class="editor-actions">
        <app-btn-toggle
          v-model="selectedIncrement"
          mandatory
          class="d-flex mb-2"
        >
          <app-btn
            v-for="increment in increments"
            :key="increment"
            :value="increment"
            class="flex-grow-1"
            small
          >
            {{ increment }}
          </app-btn>
        </app-btn-toggle>

        <div class="d-flex align-center">
          <app-btn
            color="secondary"
            class="flex-grow-1 mr-2"
            @click="adjustSelected(-selectedIncrement)"
          >
            <v-icon left>
              $chevronDown
            </v-icon>
            Down
          </app-btn>
          <app-btn
            color="primary"
            class="flex-grow-1 mr-2"
            @click="adjustSelected(selectedIncrement)"
          >
            <v-icon left>
              $chevronUp
            </v-icon>
            Up
          </app-btn>
          <app-btn
            color="warning"
            text
            @click="cancel"
          >
            Cancel
          </app-btn>
          <app-btn
            color="primary"
            @click="save"
          >
            Save
          </app-btn>
        </div>
      </div>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { M191Setting } from '@/store/console/types'
import { adjustM191Setting, buildM191SettingsSaveCommands } from '@/util/m191-settings'

@Component({})
export default class M191SettingsDialog extends Mixins(StateMixin) {
  readonly increments = [1, 5, 10]
  selectedIncrement = 1
  selectedSettingIndex = 0
  workingValues: Record<number, number> = {}

  get dialog () {
    return this.$typedState.console.m191SettingsDialog
  }

  get settings (): M191Setting[] {
    return this.dialog.settings
  }

  get open (): boolean {
    return this.dialog.open
  }

  set open (value: boolean) {
    if (!value) this.cancel()
  }

  @Watch('dialog.open')
  onDialogOpen (open: boolean) {
    if (!open || this.settings.length === 0) return
    this.workingValues = {}
    this.settings.forEach(setting => {
      Vue.set(this.workingValues, setting.index, setting.value)
    })
    this.selectedSettingIndex = this.settings[0].index
    this.selectedIncrement = 1
  }

  formatRange (setting: M191Setting): string {
    const minimum = setting.exclusiveMinimum ? `>${setting.minimum}` : `${setting.minimum}`
    return `${minimum}-${setting.maximum}${this.formatUnit(setting.unit)}`
  }

  formatValue (setting: M191Setting, value: number): string {
    if (setting.kind === 'boolean') return value === 1 ? 'Enabled' : 'Disabled'
    return `${value}${this.formatUnit(setting.unit)}`
  }

  formatUnit (unit: string): string {
    return unit === 'C' ? '°C' : unit
  }

  adjustSelected (delta: number) {
    const setting = this.settings.find(item => item.index === this.selectedSettingIndex)
    if (!setting) return
    const value = this.workingValues[setting.index]
    Vue.set(
      this.workingValues,
      setting.index,
      adjustM191Setting(setting, value, delta)
    )
  }

  cancel () {
    this.sendGcode('K2_M191_SETTINGS_CANCEL')
  }

  save () {
    const commands = buildM191SettingsSaveCommands(this.settings, this.workingValues)
    this.sendGcode(commands.join('\n'))
  }
}
</script>

<style lang="scss" scoped>
.settings-scroll-area {
  max-height: min(58vh, 520px);
  overflow-y: auto;
}

.setting-button {
  height: auto !important;
  min-height: 52px;
  text-transform: none;
}

.setting-label {
  line-height: 1.2;
}

.range-label {
  opacity: 0.72;
}

.editor-actions {
  width: 100%;
}

@media (max-width: 600px) {
  .editor-actions > .d-flex:last-child {
    flex-wrap: wrap;
    gap: 8px;
  }

  .editor-actions > .d-flex:last-child > * {
    margin-right: 0 !important;
  }
}
</style>
