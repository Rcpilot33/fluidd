// Development-only visual harness. Every command is simulated locally.
import '@/scss/global.scss'
import Vue from 'vue'
import { VApp, VMain, VContainer, VBtn } from 'vuetify/lib'
import store from '@/store'
import router from '@/router'
import i18n from '@/plugins/i18n'
import vuetify from '@/plugins/vuetify'
import { FiltersPlugin } from '@/plugins/filters'
import { SocketActions } from '@/api/socketActions'
import K2FansCard from '@/components/widgets/k2/K2FansCard.vue'
import K2FilamentCard from '@/components/widgets/k2/K2FilamentCard.vue'
import type { K2DeviceStatus } from '@/store/k2Device/types'

Vue.use(FiltersPlugin)
Vue.config.productionTip = false
vuetify.framework.theme.dark = true
store.commit('socket/setStatus', 'ready')
store.commit('server/setServerInfo', {
  ...store.state.server.info,
  klippy_state: 'ready',
  klippy_connected: true,
  components: ['k2_device']
})
const status: K2DeviceStatus = {
  connected: true,
  fans: { model: 25, case: 0, side: 65 },
  can_feed: true,
  pending: false,
  feed_state: 0,
  auto_refill: true,
  slots: ['PLA', 'PLA+ 2.0', 'PETG', 'ABS', 'Hyper PLA'].map((material, index) => ({
    box_id: index ? 1 : 0,
    slot_id: index ? index - 1 : 0,
    external: index === 0,
    label: index ? `1${String.fromCharCode(64 + index)}` : 'Spool Holder',
    material,
    name: '',
    color: ['#999999', '#ed381b', '#6dff85', '#000000', '#ed381b'][index],
    occupied: true,
    percent: null,
    humidity: index ? 23 : null
  }))
}
const update = () => store.commit('k2Device/setStatus', structuredClone(status))
update()
setInterval(update, 2000)
SocketActions.serverK2DeviceFan = async (fan, speed) => {
  status.fans[fan] = speed
  update()
  return { sent: true }
}
SocketActions.serverK2DeviceFilament = async () => {
  status.pending = true
  status.can_feed = false
  update()
  setTimeout(() => { status.pending = false; status.can_feed = true; update() }, 4000)
  return { sent: true }
}
new Vue({
  store,
  router,
  i18n,
  vuetify,
  render: h => h(VApp, [h(VMain, [h(VContainer, { style: { maxWidth: '1000px' } }, [
    h('h1', { class: 'text-h5 my-5' }, 'K2 dashboard preview — simulated printer'),
    h('p', 'Local preview only. Fan and filament commands do not contact a printer.'),
    h(VBtn, { class: 'mb-4', on: { click: () => { status.connected = !status.connected; update() } } }, 'Toggle connection'),
    h(K2FansCard, { class: 'mb-4' }), h(K2FilamentCard)
  ])])])
}).$mount('#app')
