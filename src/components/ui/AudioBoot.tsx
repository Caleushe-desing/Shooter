import { useEffect } from 'react'
import { audio } from '../../audio/audio'
import { useSettingsStore } from '../../store/settings'

/**
 * Boots the audio engine on the first user gesture (browsers block autoplay)
 * and keeps the mix in sync with the settings sliders.
 */
export function AudioBoot() {
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)

  useEffect(() => {
    const boot = () => audio.start()
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart']
    for (const event of events) {
      window.addEventListener(event, boot, { once: true, passive: true })
    }
    return () => {
      for (const event of events) window.removeEventListener(event, boot)
    }
  }, [])

  useEffect(() => {
    audio.setMusicVolume(musicVolume)
  }, [musicVolume])

  useEffect(() => {
    audio.setSfxVolume(sfxVolume)
  }, [sfxVolume])

  return null
}
