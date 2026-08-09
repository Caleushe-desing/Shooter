/** Shared Web Audio context for sample playback. */

let audioCtx: AudioContext | null = null
const bufferCache = new Map<string, AudioBuffer | null>()
const loading = new Map<string, Promise<AudioBuffer | null>>()

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  return audioCtx
}

export function unlockAudio() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
}

export async function loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
  if (bufferCache.has(url)) return bufferCache.get(url) ?? null
  const pending = loading.get(url)
  if (pending) return pending

  const job = (async () => {
    const ctx = getAudioContext()
    if (!ctx) return null
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`audio ${res.status}`)
      const raw = await res.arrayBuffer()
      const buf = await ctx.decodeAudioData(raw.slice(0))
      bufferCache.set(url, buf)
      return buf
    } catch {
      bufferCache.set(url, null)
      return null
    } finally {
      loading.delete(url)
    }
  })()

  loading.set(url, job)
  return job
}

export function playBuffer(
  buffer: AudioBuffer,
  opts: { gain?: number; playbackRate?: number; pan?: number } = {},
) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = opts.playbackRate ?? 1

  const gain = ctx.createGain()
  gain.gain.value = opts.gain ?? 1

  src.connect(gain)
  gain.connect(ctx.destination)
  src.start(0)
}

/** Prefetch a list of sample URLs (fire-and-forget). */
export function prefetchAudio(urls: readonly string[]) {
  for (const url of urls) void loadAudioBuffer(url)
}
