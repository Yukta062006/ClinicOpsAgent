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
 * Returns a high-quality, soft, pleasant and professional female voice for Web Speech.
 * Prioritizes modern Natural/Neural voices (e.g., Microsoft Neerja/Swara/Aarohi/Jenny,
 * Google Indic/UK/US Female, Apple Veena/Lekha) and strictly avoids harsh, robotic, or male voices.
 */
export function getFemaleSpeechVoice(lang: 'en' | 'hi' | 'mr'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Explicit male identifiers to strictly disqualify
  const MALE_IDENTIFIERS = [
    'male', 'david', 'rishi', 'mark', 'george', 'james', 'guy', 'stefan',
    'daniel', 'richard', 'hemant', 'madhur', 'alex', 'fred', 'oliver',
    'rory', 'arthur', 'tom', 'lee', 'pradeep', 'anil', 'ravi'
  ];

  // Preferred natural, soft, professional female voice keywords
  const PREFERRED_FEMALE_TOKENS = [
    'neerja', 'swara', 'aarohi', 'priya', 'heera', 'kalpana', 'veena',
    'lekha', 'isha', 'sangeeta', 'jenny', 'aria', 'sonia', 'libby',
    'samantha', 'serena', 'victoria', 'karen', 'shree', 'female'
  ];

  const isExcludedMale = (name: string): boolean => {
    const lower = name.toLowerCase();
    // Do not flag words like "female" simply because they contain "male"
    if (lower.includes('female')) return false;
    return MALE_IDENTIFIERS.some(id => lower.includes(id));
  };

  const isPreferredFemale = (name: string): boolean => {
    const lower = name.toLowerCase();
    return PREFERRED_FEMALE_TOKENS.some(token => lower.includes(token));
  };

  const isNaturalOrNeural = (name: string): boolean => {
    const lower = name.toLowerCase();
    return lower.includes('natural') || lower.includes('online') || lower.includes('neural') || lower.includes('google');
  };

  // Score candidate voices to select the softest, clearest, most professional female voice
  const scoreVoice = (v: SpeechSynthesisVoice, targetLang: 'en' | 'hi' | 'mr'): number => {
    const name = (v.name + ' ' + (v as any).voiceURI || '').toLowerCase();
    const voiceLang = (v.lang || '').toLowerCase().replace(/_/g, '-');

    if (isExcludedMale(name)) return -1000;

    let score = 0;

    if (targetLang === 'hi') {
      if (voiceLang === 'hi-in' || voiceLang.startsWith('hi')) score += 100;
      else return -1000;
    } else if (targetLang === 'mr') {
      if (voiceLang === 'mr-in' || voiceLang.startsWith('mr')) score += 100;
      // High-quality fallback: Hindi Devanagari female voice if native Marathi voice is not installed
      else if (voiceLang === 'hi-in' || voiceLang.startsWith('hi')) score += 55;
      else return -1000;
    } else {
      // English: Prioritize Indian English (en-IN), then natural international English
      if (voiceLang === 'en-in') score += 100;
      else if (name.includes('india')) score += 90;
      else if (voiceLang.startsWith('en')) score += 45;
      else return -1000;
    }

    // High fidelity: Microsoft Online (Natural) or Google neural voices
    if (isNaturalOrNeural(name)) score += 35;

    // Verified professional female vocal profile
    if (isPreferredFemale(name)) score += 30;

    // Highest preference for warm, pleasant clinic voices
    if (targetLang === 'en' && (name.includes('neerja') || name.includes('priya') || name.includes('heera') || name.includes('veena'))) {
      score += 45;
    }
    if (targetLang === 'hi' && (name.includes('swara') || name.includes('kalpana') || name.includes('lekha'))) {
      score += 45;
    }
    if (targetLang === 'mr' && (name.includes('aarohi') || name.includes('marathi'))) {
      score += 45;
    }

    // Minor penalty for legacy harsh desktop SAPI synthesizers
    if (name.includes('desktop') || name.includes('espeak')) {
      score -= 25;
    }

    return score;
  };

  const scored = voices
    .map(v => ({ voice: v, score: scoreVoice(v, lang) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored[0].voice;
  }

  // Graceful multi-tiered fallback without breaking announcements
  const langPrefix = lang === 'en' ? 'en' : (lang === 'hi' ? 'hi' : 'mr');
  const fallback = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix) && !isExcludedMale(v.name)) ||
                   (lang === 'mr' ? voices.find(v => v.lang.toLowerCase().startsWith('hi') && !isExcludedMale(v.name)) : null) ||
                   voices.find(v => v.lang.toLowerCase().startsWith('en') && !isExcludedMale(v.name)) ||
                   voices[0] || null;

  return fallback;
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
    .replace(/\s+/g, ' ')
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
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      if (femaleVoice.lang) {
        utterance.lang = femaleVoice.lang;
      }
    }

    // Calm, clear clinic cadence (avoids rushed or robotic speech)
    utterance.rate = Math.max(0.7, Math.min(speed * 0.90, 1.25));
    utterance.pitch = 1.0; // Natural acoustic resonance
    utterance.volume = Math.max(0, Math.min(volume, 1.0));

    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}
