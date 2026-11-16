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
      const isHi = voiceLang === 'hi-in' || voiceLang.startsWith('hi') || name.includes('हिन्दी') || name.includes('hindi');
      if (!isHi) return -1000;
      score += 100;

      // 1. Ultra-high quality Azure Neural voice: Microsoft Swara Online (Natural)
      if (name.includes('swara') && isNaturalOrNeural(name)) {
        score += 95;
      } else if (name.includes('swara')) {
        score += 75;
      }

      // 2. High-quality Google Neural voice in Chrome/Android: Google हिन्दी / Google Hindi / hi-in-x-hie-*
      if (name.includes('google') || name.includes('x-hie')) {
        score += 90;
      }

      // 3. Apple Enhanced/Premium natural voice: Lekha / Kavya / Ananya
      if (name.includes('lekha') || name.includes('kavya') || name.includes('ananya')) {
        score += 80;
      }

      // 4. Any other Natural / Online / Neural Hindi voice
      if (isNaturalOrNeural(name)) {
        score += 40;
      }

      // 5. Desktop offline fallback (Kalpana): reliable local fallback, ranked behind neural voices
      if (name.includes('kalpana')) {
        score += 25;
      }
    } else if (targetLang === 'mr') {
      const isMr = voiceLang === 'mr-in' || voiceLang.startsWith('mr') || name.includes('मराठी') || name.includes('marathi');
      if (isMr) {
        score += 100;
        if (name.includes('aarohi') && isNaturalOrNeural(name)) score += 90;
        else if (name.includes('aarohi')) score += 70;
        if (name.includes('google')) score += 85;
        if (isNaturalOrNeural(name)) score += 35;
      } else if (voiceLang === 'hi-in' || voiceLang.startsWith('hi') || name.includes('हिन्दी') || name.includes('hindi')) {
        // High-quality fallback: Hindi Devanagari female voice if native Marathi voice is not installed
        score += 55;
        if (name.includes('swara') && isNaturalOrNeural(name)) score += 35;
        if (name.includes('google')) score += 30;
      } else {
        return -1000;
      }
    } else {
      // English: Prioritize Indian English (en-IN), then natural international English
      if (voiceLang === 'en-in') score += 100;
      else if (name.includes('india')) score += 90;
      else if (voiceLang.startsWith('en')) score += 45;
      else return -1000;

      if (isNaturalOrNeural(name)) score += 35;
      if (isPreferredFemale(name)) score += 30;

      if (name.includes('neerja') || name.includes('priya') || name.includes('heera') || name.includes('veena')) {
        score += 45;
      }
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

// Pre-warm browser speech synthesis voice list if available
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  } catch {
    // Ignore in non-browser or test mock environments
  }
}

/**
 * Devanagari digit words for natural, fluent Hindi pronunciation.
 */
export const HINDI_DIGIT_WORDS: Record<string, string> = {
  '0': 'शून्य',
  '1': 'एक',
  '2': 'दो',
  '3': 'तीन',
  '4': 'चार',
  '5': 'पाँच',
  '6': 'छह',
  '7': 'सात',
  '8': 'आठ',
  '9': 'नौ',
};

/**
 * Devanagari phonetic representations of English alphabet letters for clinic tokens.
 */
export const HINDI_LETTER_WORDS: Record<string, string> = {
  a: 'ए',
  b: 'बी',
  c: 'सी',
  d: 'डी',
  e: 'ई',
  f: 'एफ़',
  g: 'जी',
  h: 'एच',
  i: 'आई',
  j: 'जे',
  k: 'के',
  l: 'एल',
  m: 'एम',
  n: 'एन',
  o: 'ओ',
  p: 'पी',
  q: 'क्यू',
  r: 'आर',
  s: 'एस',
  t: 'टी',
  u: 'यू',
  v: 'वी',
  w: 'डब्लू',
  x: 'एक्स',
  y: 'वाई',
  z: 'ज़ेड',
};

/**
 * Devanagari digit words for natural Marathi pronunciation.
 */
export const MARATHI_DIGIT_WORDS: Record<string, string> = {
  '0': 'शून्य',
  '1': 'एक',
  '2': 'दोन',
  '3': 'तीन',
  '4': 'चार',
  '5': 'पाच',
  '6': 'सहा',
  '7': 'सात',
  '8': 'आठ',
  '9': 'नऊ',
};

/**
 * Formats token string for authentic, natural Hindi spoken pronunciation.
 * E.g., '001' -> 'शून्य शून्य एक', '042' -> 'शून्य चार दो', 'GM-001' -> 'जी एम शून्य शून्य एक'
 */
export function formatTokenForHindi(rawToken: string): string {
  if (!rawToken) return 'शून्य शून्य एक';
  const cleaned = rawToken.trim().replace(/[-_/]/g, ' ');
  const words: string[] = [];

  for (const char of cleaned) {
    if (char === ' ') continue;
    const digit = HINDI_DIGIT_WORDS[char];
    if (digit) {
      words.push(digit);
      continue;
    }
    const letter = HINDI_LETTER_WORDS[char.toLowerCase()];
    if (letter) {
      words.push(letter);
      continue;
    }
    words.push(char);
  }

  return words.join(' ');
}

/**
 * Formats token string for authentic Marathi spoken pronunciation.
 * E.g., '002' -> 'शून्य शून्य दोन', 'A-012' -> 'ए शून्य एक दोन'
 */
export function formatTokenForMarathi(rawToken: string): string {
  if (!rawToken) return 'शून्य शून्य एक';
  const cleaned = rawToken.trim().replace(/[-_/]/g, ' ');
  const words: string[] = [];

  for (const char of cleaned) {
    if (char === ' ') continue;
    const digit = MARATHI_DIGIT_WORDS[char];
    if (digit) {
      words.push(digit);
      continue;
    }
    const letter = HINDI_LETTER_WORDS[char.toLowerCase()];
    if (letter) {
      words.push(letter);
      continue;
    }
    words.push(char);
  }

  return words.join(' ');
}

/**
 * Formats room for polite Hindi announcement.
 * E.g., 'Room 02' -> 'कमरा नंबर दो', 'Room 1' -> 'कमरा नंबर एक', 'Consultation Room' -> 'परामर्श कक्ष'
 */
export function formatRoomForHindi(room?: string): string {
  if (!room || room === 'the consultation room') {
    return 'परामर्श कक्ष';
  }
  const trimmed = room.trim();
  const roomMatch = trimmed.match(/^(?:room|कमरा)\s*(?:no\.?|number|नंबर)?\s*0?(\d+)$/i);
  if (roomMatch) {
    const num = roomMatch[1];
    const hindiNum = HINDI_DIGIT_WORDS[num] || num;
    return `कमरा नंबर ${hindiNum}`;
  }
  const counterMatch = trimmed.match(/^(?:counter|काउंटर)\s*(?:no\.?|number|नंबर)?\s*0?(\d+)$/i);
  if (counterMatch) {
    const num = counterMatch[1];
    const hindiNum = HINDI_DIGIT_WORDS[num] || num;
    return `काउंटर नंबर ${hindiNum}`;
  }
  const consultMatch = trimmed.match(/^consultation\s*room\s*0?(\d+)$/i);
  if (consultMatch) {
    const num = consultMatch[1];
    const hindiNum = HINDI_DIGIT_WORDS[num] || num;
    return `परामर्श कक्ष ${hindiNum}`;
  }
  return trimmed;
}

/**
 * Formats room for polite Marathi announcement.
 */
export function formatRoomForMarathi(room?: string): string {
  if (!room || room === 'the consultation room') {
    return 'तपासणी कक्षात';
  }
  const trimmed = room.trim();
  const roomMatch = trimmed.match(/^(?:room|खोली)\s*(?:no\.?|number|क्रमांक)?\s*0?(\d+)$/i);
  if (roomMatch) {
    const num = roomMatch[1];
    const marathiNum = MARATHI_DIGIT_WORDS[num] || num;
    return `खोली क्रमांक ${marathiNum} मध्ये`;
  }
  return 'तपासणी कक्षात';
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
    const hindiToken = formatTokenForHindi(token);
    const hindiRoom = formatRoomForHindi(room);
    // Respectful, polite clinic announcement with 'आइए' (formal respectful imperative)
    announcementText = `टोकन नंबर ${hindiToken}, कृपया ${hindiRoom} में आइए।`;
    if (patientName && patientName !== 'Registered Patient') {
      announcementText = `टोकन नंबर ${hindiToken}, ${patientName}, कृपया ${hindiRoom} में आइए।`;
    }
  } else if (language === 'mr') {
    const marathiToken = formatTokenForMarathi(token);
    const marathiRoom = formatRoomForMarathi(room);
    announcementText = `टोकन क्रमांक ${marathiToken}, कृपया ${marathiRoom} या.`;
    if (patientName && patientName !== 'Registered Patient') {
      announcementText = `टोकन क्रमांक ${marathiToken}, ${patientName}, कृपया ${marathiRoom} या.`;
    }
  } else {
    // English template
    announcementText = `Token number ${spokenToken}, please proceed to ${roomName}.`;
    if (patientName && patientName !== 'Registered Patient') {
      announcementText = `Token number ${spokenToken}, ${patientName}, please proceed to ${roomName}.`;
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
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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

    // Tuning rate and pitch specifically for authentic language cadence
    if (language === 'hi') {
      // Natural conversational cadence for Hindi Devanagari phonetics (avoids dragging or rushing)
      utterance.rate = Math.max(0.85, Math.min(speed * 0.98, 1.15));
      utterance.pitch = 1.0;
    } else if (language === 'mr') {
      utterance.rate = Math.max(0.85, Math.min(speed * 0.96, 1.15));
      utterance.pitch = 1.0;
    } else {
      utterance.rate = Math.max(0.80, Math.min(speed * 0.92, 1.25));
      utterance.pitch = 1.0;
    }
    utterance.volume = Math.max(0, Math.min(volume, 1.0));

    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}
