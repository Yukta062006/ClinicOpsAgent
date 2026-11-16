export type GameSoundName =
  | 'points'
  | 'level'
  | 'achievement'
  | 'flip'
  | 'wrong'
  | 'click'
  | 'win'
  | 'match'
  | 'snap'
  | 'start'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null

  if (!audioContext) {
    audioContext = new AudioCtor()
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
  return audioContext
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  peak: number,
  type: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const start = ctx.currentTime + startOffset

  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + 0.018)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

/**
 * Warm, synthesized UI sounds so the arcade does not depend on external audio files.
 * All sounds are quiet, short and built from soft sine/triangle tones.
 */
export function playGameSound(
  sound: GameSoundName,
  enabled: boolean,
  volume: number
) {
  if (!enabled || volume <= 0) return
  const ctx = getAudioContext()
  if (!ctx) return

  const master = Math.min(1, Math.max(0, volume)) * 0.32

  switch (sound) {
    case 'points':
      playTone(ctx, 523.25, 0, 0.22, master * 0.8, 'triangle')
      playTone(ctx, 659.25, 0.055, 0.24, master * 0.75, 'triangle')
      playTone(ctx, 783.99, 0.11, 0.3, master * 0.7, 'sine')
      playTone(ctx, 1046.5, 0.16, 0.26, master * 0.35, 'sine')
      break

    case 'level':
      playTone(ctx, 523.25, 0, 0.3, master * 0.8, 'triangle')
      playTone(ctx, 659.25, 0.1, 0.32, master * 0.8, 'triangle')
      playTone(ctx, 783.99, 0.2, 0.34, master * 0.8, 'triangle')
      playTone(ctx, 1046.5, 0.3, 0.55, master * 0.85, 'sine')
      playTone(ctx, 1568, 0.36, 0.4, master * 0.3, 'sine')
      break

    case 'achievement':
      playTone(ctx, 392, 0, 0.35, master * 0.7, 'triangle')
      playTone(ctx, 493.88, 0.09, 0.35, master * 0.7, 'triangle')
      playTone(ctx, 587.33, 0.18, 0.4, master * 0.75, 'triangle')
      playTone(ctx, 783.99, 0.28, 0.65, master * 0.8, 'sine')
      playTone(ctx, 1174.66, 0.34, 0.55, master * 0.35, 'sine')
      playTone(ctx, 1567.98, 0.42, 0.45, master * 0.22, 'sine')
      break

    case 'flip':
      playTone(ctx, 740, 0, 0.08, master * 0.45, 'sine')
      break

    case 'wrong':
      playTone(ctx, 392, 0, 0.16, master * 0.45, 'sine')
      playTone(ctx, 311.13, 0.12, 0.24, master * 0.4, 'sine')
      break

    case 'win':
      playTone(ctx, 523.25, 0, 0.25, master * 0.8, 'triangle')
      playTone(ctx, 659.25, 0.08, 0.28, master * 0.8, 'triangle')
      playTone(ctx, 783.99, 0.16, 0.3, master * 0.85, 'triangle')
      playTone(ctx, 1046.5, 0.25, 0.55, master * 0.9, 'sine')
      playTone(ctx, 1318.51, 0.35, 0.45, master * 0.4, 'sine')
      break

    case 'match':
      playTone(ctx, 587.33, 0, 0.14, master * 0.6, 'triangle')
      playTone(ctx, 880, 0.08, 0.22, master * 0.7, 'sine')
      break

    case 'snap':
      playTone(ctx, 700, 0, 0.05, master * 0.5, 'sine')
      playTone(ctx, 1200, 0.03, 0.08, master * 0.4, 'triangle')
      break

    case 'start':
      playTone(ctx, 440, 0, 0.12, master * 0.5, 'triangle')
      playTone(ctx, 659.25, 0.09, 0.2, master * 0.6, 'sine')
      break

    case 'click':
      playTone(ctx, 880, 0, 0.06, master * 0.3, 'triangle')
      break

    default:
      break
  }
}
