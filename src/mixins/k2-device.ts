import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { K2DeviceStatus } from '@/store/k2Device/types'
import { EventBus } from '@/eventBus'

@Component
export default class K2DeviceMixin extends Mixins(StateMixin) {
  now = Date.now()
  clock?: ReturnType<typeof setInterval>
  sending = false

  mounted () {
    this.clock = setInterval(() => { this.now = Date.now() }, 1000)
  }

  beforeDestroy () {
    clearInterval(this.clock)
  }

  get device (): K2DeviceStatus {
    return this.$typedState.k2Device.status
  }

  get deviceReady () {
    return this.klippyReady && this.socketReady && this.device.connected &&
      this.now - this.$typedState.k2Device.receivedAt < 10000
  }

  async sendDeviceCommand (command: () => Promise<unknown>) {
    if (!this.deviceReady || this.sending) return
    this.sending = true
    try {
      await command()
      EventBus.$emit(this.$t('app.k2.msg.command_sent').toString(), { type: 'success' })
    } catch {
      // The socket client displays the server's error. Do not retry commands.
    } finally {
      this.sending = false
    }
  }
}
