import type { ActionTree, MutationTree } from 'vuex'
import type { RootState } from '../types'
import type { K2DeviceState, K2DeviceStatus } from './types'
import { SocketActions } from '@/api/socketActions'

export const defaultState = (): K2DeviceState => ({
  status: {
    connected: false,
    fans: { model: null, case: null, side: null },
    slots: [],
    can_feed: false,
    pending: false,
    feed_state: null,
    auto_refill: null
  },
  receivedAt: 0
})

export const k2Device = {
  namespaced: true,
  state: defaultState(),
  mutations: {
    setReset (state) {
      Object.assign(state, defaultState())
    },
    setStatus (state, status: K2DeviceStatus) {
      state.status = status
      state.receivedAt = Date.now()
    }
  } satisfies MutationTree<K2DeviceState>,
  actions: {
    reset ({ commit }) {
      commit('setReset')
    },
    async init () {
      await SocketActions.serverK2DeviceStatus()
    },
    onStatus ({ commit }, payload: K2DeviceStatus) {
      commit('setStatus', payload)
    }
  } satisfies ActionTree<K2DeviceState, RootState>
}
