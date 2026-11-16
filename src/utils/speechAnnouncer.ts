import { apiTts } from './api';

export interface AnnouncePatientOptions {
  token: string;
  patientName: string;
  room?: string;
  doctorName?: string;
  language?: 'en' | 'hi' | 'mr';
  speed?: number;
  volume?: number;
  isMuted?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Returns a high-quality natural female voice for Web Speech fallback.
 */
export function getFemaleSpeechVoice(lang: 'en' | 'hi' | 'mr'): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const isFemale = (v: SpeechSynthesisVoice) => {
    const lower = (v.name + ' ' + (v as any).voiceURI || '').toLowerCase();
    if (lower.includes('male') && !lower.includes('female')) return false;
    if (lower.includes('david') || lower.includes('rishi') || lower.includes('mark') || 
        lower.includes('george') || lower.includes('james') || lower.includes('daniel')) {
      return false;
    }
    if (lower.includes('female') || lower.includes('zira') || lower.includes('heera') || 
        lower.includes('neerja') || lower.includes('veena') || lower.includes('swara') || 
        lower.includes('priya') || lower.includes('jenny') || lower.includes('samantha')) {
      return true;
    }
    return true; // Neutral fallback
  };

  if (lang === 'hi') {
    return voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && isFemale(v)) ||
           voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi')) || null;
  }
  if (lang === 'mr') {
    return voices.find(v => (v.lang === 'mr-IN' || v.lang.startsWith('mr')) && isFemale(v)) ||
           voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && isFemale(v)) || null;
  }

  // English: Prioritize Indian English female (e.g. Heera, Neerja, Veena), then natural English female
  return voices.find(v => (v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) && isFemale(v)) ||
         voices.find(v => v.lang.startsWith('en') && isFemale(v)) ||
         voices[0] || null;
}

/**
 * Plays a warm, professional hospital announcement chime (A5 880Hz -> E5 660Hz).
 */
export function playHospitalChime(volume: number = 0.9): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const vol = Math.max(0.01, Math.min(volume, 1.0));

      // Bell chime tone 1: A5 (880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18 * vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Bell chime tone 2: E5 (659.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.22);
      gain2.gain.setValueAtTime(0.20 * vol, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.75);

      setTimeout(() => {
        resolve();
      }, 700);
    } catch {
      resolve();
    }
  });
}

let activeAudioElement: HTMLAudioElement | null = null;
let lastAnnouncementPayload: AnnouncePatientOptions | null = null;

/**
 * Cleanly cancels any ongoing voice playback or browser utterance.
 */
export function stopAnnouncement(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Formats token string for natural spoken clarity.
 * E.g., 'GM-001' -> 'G M 001', '001' -> '001', 'A-002' -> 'A 002'
 */
export function formatSpokenToken(rawToken: string): string {
  if (!rawToken) return '001';
  return rawToken
    .replace(/^([A-Za-z]+)-?(\d+)$/, '$1 $2')
    .replace(/([A-Z])/g, '$1 ')
    .trim();
}

/**
 * Announces a patient call using Project Vaani TTS (or fallback) with natural female healthcare AI voice.
 */
export async function announcePatientCalling(options: AnnouncePatientOptions): Promise<{ engine: string; text: string }> {
  const {
    token,
    patientName,
    room,
    doctorName,
    language = 'en',
    speed = 0.95,
    volume = 0.95,
    isMuted = false,
    onStart,
    onEnd
  } = options;

  lastAnnouncementPayload = { ...options };

  // Stop previous announcements to avoid overlap
  stopAnnouncement();

  if (isMuted) {
    onEnd?.();
    return { engine: 'Muted', text: '' };
  }

  // Play announcement chime
  await playHospitalChime(volume);

  const spokenToken = formatSpokenToken(token);
  const roomName = room || 'the consultation room';

  let announcementText = '';
  if (language === 'hi') {
    // Exact requested Hindi template
    announcementText = `टोकन नंबर ${spokenToken}, कृपया परामर्श कक्ष में आएं।`;
    if (patientName && patientName !== 'Registered Patient') {
      announcementText = `टोकन नंबर ${spokenToken}, ${patientName}, कृपया परामर्श कक्ष में आएं।`;
    }
  } else if (language === 'mr') {
    // Exact requested Marathi template
    announcementText = `टोकन क्रमांक ${spokenToken}, कृपया तपासणी कक्षात या.`;
    if (patientName && patientName !== 'Registered Patient') {
      announcementText = `टोकन क्रमांक ${spokenToken}, ${patientName}, कृपया तपासणी कक्षात या.`;
    }
  } else {
    // Exact requested English template
    announcementText = `Token number ${spokenToken}, please proceed to the consultation room.`;
    if (patientName && patientName !== 'Registered Patient') {
      announcementText = `Token number ${spokenToken}, ${patientName}, please proceed to the consultation room.`;
    }
  }

  onStart?.();

  try {
    // 1. Synthesize via Project Vaani (DhVaani-0.5) backend
    const res = await apiTts.synthesize({
      text: announcementText,
      language,
      speed,
      voiceGender: 'female',
    });

    if (res.success && res.data?.audioBase64) {
      const audio = new Audio(`data:${res.data.format || 'audio/wav'};base64,${res.data.audioBase64}`);
      audio.volume = Math.max(0, Math.min(volume, 1.0));
      audio.playbackRate = Math.max(0.5, Math.min(speed, 2.0));
      activeAudioElement = audio;

      const engineName = res.data.engine === 'project-vaani-dhvaani-0.5'
        ? 'Project Vaani (DhVaani-0.5 Female AI Voice)'
        : 'Sarvam AI (Female AI Voice)';

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          activeAudioElement = null;
          onEnd?.();
          resolve();
        };
        audio.onerror = () => {
          activeAudioElement = null;
          fallbackWebSpeech(announcementText, language, speed, volume, onEnd);
          resolve();
        };
        audio.play().catch(() => {
          fallbackWebSpeech(announcementText, language, speed, volume, onEnd);
          resolve();
        });
      });

      return { engine: engineName, text: announcementText };
    }
  } catch (err) {
    console.warn('Backend TTS announcement failed, using female Web Speech fallback:', err);
  }

  // 2. Client-side Natural Female Voice Fallback
  fallbackWebSpeech(announcementText, language, speed, volume, onEnd);
  return { engine: 'Natural Female Voice (Local Fallback)', text: announcementText };
}

/**
 * Replays the most recent announcement.
 */
export async function replayLastAnnouncement(): Promise<{ engine: string; text: string } | null> {
  if (!lastAnnouncementPayload) return null;
  return announcePatientCalling(lastAnnouncementPayload);
}

function fallbackWebSpeech(
  text: string, 
  language: 'en' | 'hi' | 'mr', 
  speed: number = 0.95,
  volume: number = 0.95,
  onEnd?: () => void
) {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-IN';

    const femaleVoice = getFemaleSpeechVoice(language);
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.rate = Math.max(0.6, Math.min(speed * 0.95, 1.8));
    utterance.pitch = 1.05;
    utterance.volume = Math.max(0, Math.min(volume, 1.0));

    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}
