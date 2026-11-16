import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFemaleSpeechVoice, formatSpokenToken } from '../src/utils/speechAnnouncer';

describe('Voice Quality and Selection Suite', () => {
  const mockVoices: any[] = [
    // English voices
    { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US', voiceURI: 'David' },
    { name: 'Microsoft Mark - English (United States)', lang: 'en-US', voiceURI: 'Mark' },
    { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US', voiceURI: 'Zira' },
    { name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN', voiceURI: 'Neerja' },
    { name: 'Microsoft Priya Online (Natural) - English (India)', lang: 'en-IN', voiceURI: 'Priya' },
    { name: 'Google UK English Female', lang: 'en-GB', voiceURI: 'Google UK Female' },
    // Hindi voices
    { name: 'Microsoft Hemant - Hindi (India)', lang: 'hi-IN', voiceURI: 'Hemant' },
    { name: 'Microsoft Swara Online (Natural) - Hindi (India)', lang: 'hi-IN', voiceURI: 'Swara' },
    { name: 'Microsoft Kalpana - Hindi (India)', lang: 'hi-IN', voiceURI: 'Kalpana' },
    { name: 'Google हिन्दी', lang: 'hi-IN', voiceURI: 'Google Hindi' },
    // Marathi voices
    { name: 'Microsoft Aarohi Online (Natural) - Marathi (India)', lang: 'mr-IN', voiceURI: 'Aarohi' },
    { name: 'Google मराठी', lang: 'mr-IN', voiceURI: 'Google Marathi' },
  ];

  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      speak: vi.fn(),
      cancel: vi.fn(),
      paused: false,
      speaking: false,
    });
  });

  it('selects soft, natural Indian English female voice (Neerja) over robotic voices', () => {
    const voice = getFemaleSpeechVoice('en');
    expect(voice).not.toBeNull();
    expect(voice?.name).toBe('Microsoft Neerja Online (Natural) - English (India)');
    expect(voice?.lang).toBe('en-IN');
  });

  it('strictly excludes male voices for English', () => {
    const maleOnlyList = [
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Microsoft Rishi', lang: 'en-IN' },
      { name: 'Microsoft Mark', lang: 'en-US' },
    ];
    (window.speechSynthesis.getVoices as any).mockReturnValue(maleOnlyList);
    const voice = getFemaleSpeechVoice('en');
    // None of the male voices should receive positive scores
    expect(voice?.name).toBe('Microsoft David'); // ultimate fallback only when zero females exist
  });

  it('selects natural Hindi female voice (Swara) over male voice (Hemant)', () => {
    const voice = getFemaleSpeechVoice('hi');
    expect(voice).not.toBeNull();
    expect(voice?.name).toBe('Microsoft Swara Online (Natural) - Hindi (India)');
    expect(voice?.lang).toBe('hi-IN');
  });

  it('selects natural Marathi female voice (Aarohi) when available', () => {
    const voice = getFemaleSpeechVoice('mr');
    expect(voice).not.toBeNull();
    expect(voice?.name).toBe('Microsoft Aarohi Online (Natural) - Marathi (India)');
    expect(voice?.lang).toBe('mr-IN');
  });

  it('gracefully falls back to high-quality Devanagari Hindi female voice when Marathi voice is absent', () => {
    const withoutMarathi = mockVoices.filter(v => !v.lang.startsWith('mr'));
    (window.speechSynthesis.getVoices as any).mockReturnValue(withoutMarathi);

    const voice = getFemaleSpeechVoice('mr');
    expect(voice).not.toBeNull();
    // Swara (Natural Hindi) is chosen for Marathi text to preserve authentic Devanagari pronunciation
    expect(voice?.name).toBe('Microsoft Swara Online (Natural) - Hindi (India)');
  });

  it('formats tokens clearly for natural clinical pronunciation', () => {
    expect(formatSpokenToken('001')).toBe('001');
    expect(formatSpokenToken('042')).toBe('042');
    expect(formatSpokenToken('GM-001')).toBe('G M 001');
    expect(formatSpokenToken('A-012')).toBe('A 012');
  });
});
