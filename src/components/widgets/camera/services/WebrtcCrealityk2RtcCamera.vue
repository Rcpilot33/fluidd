<template>
  <video
    ref="streamingElement"
    autoplay
    disablePictureInPicture
    playsinline
    muted
    :style="cameraStyle"
    :crossorigin="crossorigin"
    @play="updateStatus('connected')"
    @error="onError"
  />
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import { consola } from 'consola'
import sleep from '@/util/sleep'

type RTCConfigurationWithSdpSemantics = RTCConfiguration & {
  sdpSemantics: 'unified-plan'
}

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' }
]

@Component({})
export default class WebrtcCrealityk2RtcCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  pc: RTCPeerConnection | null = null
  playbackAbortController: AbortController | null = null
  sleepAbortController: AbortController | null = null

  async loadStream () {
    this.pc?.close()

    const signal = this.playbackAbortController?.signal
    if (!signal || signal.aborted) return

    this.updateStatus('connecting')
    const url = this.buildAbsoluteUrl(this.camera.stream_url || '')
    this.updateRawCameraUrl(url.toString())

    try {
      const config: RTCConfigurationWithSdpSemantics = {
        sdpSemantics: 'unified-plan',
        iceServers
      }
      const pc = this.pc = new RTCPeerConnection(config)

      pc.onicecandidate = async event => {
        if (event.candidate !== null || !pc.localDescription) return
        try {
          const response = await fetch(`${url}call/webrtc_local`, {
            body: btoa(JSON.stringify({
              type: 'offer',
              sdp: pc.localDescription.sdp
            })),
            headers: { 'Content-Type': 'plain/text' },
            method: 'POST',
            signal
          })
          const answer = JSON.parse(
            atob(await response.text())
          ) as RTCSessionDescriptionInit
          if (answer.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer))
          }
        } catch (error) {
          consola.error('[WebrtcCrealityk2RtcCamera] onicecandidate', error)
          this.onError()
        }
      }

      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.ontrack = event => {
        if (event.track.kind === 'video') {
          this.cameraVideo.srcObject = event.streams[0]
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      consola.debug('[WebrtcCrealityk2RtcCamera] Set Creality K2 Camera')
    } catch (error) {
      consola.error(`[WebrtcCrealityk2RtcCamera] failed to start playback "${this.camera.name}"`, error)
      this.onError()
    }
  }

  async onError () {
    this.updateStatus('error')
    this.pc?.close()
    this.pc = null

    const signal = this.playbackAbortController?.signal
    if (!signal || signal.aborted) return

    this.sleepAbortController?.abort()
    const retry = this.sleepAbortController = new AbortController()
    try {
      await sleep(2000, AbortSignal.any([signal, retry.signal]))
      this.loadStream()
    } catch {}
  }

  async startPlayback () {
    this.playbackAbortController = new AbortController()
    await this.loadStream()
  }

  stopPlayback () {
    this.updateStatus('disconnected')
    this.playbackAbortController?.abort()
    this.playbackAbortController = null
    this.pc?.close()
    this.pc = null
    this.cameraVideo.src = ''
    this.cameraVideo.srcObject = null
  }
}
</script>
