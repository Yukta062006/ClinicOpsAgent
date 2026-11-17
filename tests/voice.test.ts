import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getFemaleSpeechVoice, 
  formatSpokenToken, 
  formatTokenForHindi, 
  formatTokenForMarathi,
  formatTokenForBengali,
  formatRoomForHindi,
  formatRoomForMarathi,
  formatRoomForBengali,
  announcePatientCalling
} from '../src/utils/speechAnnouncer';

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
    // Bengali voices
    { name: 'Microsoft Bashkar Online (Natural) - Bengali (India)', lang: 'bn-IN', voiceURI: 'Bashkar' },
    { name: 'Microsoft Tanishaa Online (Natural) - Bengali (India)', lang: 'bn-IN', voiceURI: 'Tanishaa' },
    { name: 'Microsoft Nabaneeta Online (Natural) - Bengali (Bangladesh)', lang: 'bn-BD', voiceURI: 'Nabaneeta' },
    { name: 'Google বাংলা', lang: 'bn-IN', voiceURI: 'Google Bengali' },
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

  it('selects Google हिन्दी in Chrome environment when Swara is not present', () => {
    const chromeVoices = mockVoices.filter(v => !v.name.includes('Swara'));
    (window.speechSynthesis.getVoices as any).mockReturnValue(chromeVoices);

    const voice = getFemaleSpeechVoice('hi');
    expect(voice).not.toBeNull();
    expect(voice?.name).toBe('Google हिन्दी');
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

  it('formats tokens into authentic Devanagari words for natural Hindi speech synthesis', () => {
    expect(formatTokenForHindi('001')).toBe('शून्य शून्य एक');
    expect(formatTokenForHindi('042')).toBe('शून्य चार दो');
    expect(formatTokenForHindi('A-012')).toBe('ए शून्य एक दो');
    expect(formatTokenForHindi('GM-001')).toBe('जी एम शून्य शून्य एक');
    expect(formatTokenForHindi('OPD-005')).toBe('ओ पी डी शून्य शून्य पाँच');
  });

  it('formats tokens into authentic Devanagari words for Marathi speech synthesis', () => {
    expect(formatTokenForMarathi('001')).toBe('शून्य शून्य एक');
    expect(formatTokenForMarathi('002')).toBe('शून्य शून्य दोन');
    expect(formatTokenForMarathi('A-012')).toBe('ए शून्य एक दोन');
    expect(formatTokenForMarathi('GM-006')).toBe('जी एम शून्य शून्य सहा');
  });

  it('formats room cleanly into respectful Hindi phrases', () => {
    expect(formatRoomForHindi('Room 02')).toBe('कमरा नंबर दो');
    expect(formatRoomForHindi('Room 1')).toBe('कमरा नंबर एक');
    expect(formatRoomForHindi('Counter 3')).toBe('काउंटर नंबर तीन');
    expect(formatRoomForHindi('Consultation Room 04')).toBe('परामर्श कक्ष चार');
    expect(formatRoomForHindi('the consultation room')).toBe('परामर्श कक्ष');
    expect(formatRoomForHindi(undefined)).toBe('परामर्श कक्ष');
  });

  it('generates polite, natural hospital announcement text in Hindi', async () => {
    const res = await announcePatientCalling({
      token: '001',
      patientName: 'Registered Patient',
      room: 'Room 02',
      language: 'hi',
    });

    expect(res.text).toBe('टोकन नंबर शून्य शून्य एक, कृपया कमरा नंबर दो में आइए।');
  });

  it('generates polite hospital announcement text in Marathi', async () => {
    const res = await announcePatientCalling({
      token: '002',
      patientName: 'Registered Patient',
      room: 'Room 02',
      language: 'mr',
    });

    expect(res.text).toBe('टोकन क्रमांक शून्य शून्य दोन, कृपया खोली क्रमांक दोन मध्ये या.');
  });

  it('selects natural Bengali female voice (Tanishaa) over male voice (Bashkar)', () => {
    const voice = getFemaleSpeechVoice('bn');
    expect(voice).not.toBeNull();
    expect(voice?.name).toBe('Microsoft Tanishaa Online (Natural) - Bengali (India)');
    expect(voice?.lang).toBe('bn-IN');
  });

  it('selects Google বাংলা in Chrome environment when Tanishaa is not present', () => {
    const withoutTanishaa = mockVoices.filter(v => !v.name.includes('Tanishaa') && !v.name.includes('Nabaneeta'));
    (window.speechSynthesis.getVoices as any).mockReturnValue(withoutTanishaa);

    const voice = getFemaleSpeechVoice('bn');
    expect(voice).not.toBeNull();
    expect(voice?.name).toBe('Google বাংলা');
  });

  it('strictly excludes male voices for Bengali (such as Bashkar)', () => {
    const maleOnlyBengali = [
      { name: 'Microsoft Bashkar Online (Natural) - Bengali (India)', lang: 'bn-IN' },
      { name: 'Microsoft Pradeep - Bengali (India)', lang: 'bn-IN' },
    ];
    (window.speechSynthesis.getVoices as any).mockReturnValue(maleOnlyBengali);

    const voice = getFemaleSpeechVoice('bn');
    // None of the male voices should be selected via positive scores
    expect(voice?.name).toBe('Microsoft Bashkar Online (Natural) - Bengali (India)'); // fallback only
  });

  it('gracefully falls back to high-quality Indic female voice when Bengali voice is absent', () => {
    const withoutBengali = mockVoices.filter(v => !v.lang.startsWith('bn'));
    (window.speechSynthesis.getVoices as any).mockReturnValue(withoutBengali);

    const voice = getFemaleSpeechVoice('bn');
    expect(voice).not.toBeNull();
    // Swara (Natural Hindi) is chosen as Indic phonetic fallback
    expect(voice?.name).toBe('Microsoft Swara Online (Natural) - Hindi (India)');
  });

  it('formats tokens into authentic Bengali words for natural Bengali speech synthesis', () => {
    expect(formatTokenForBengali('001')).toBe('শূন্য শূন্য এক');
    expect(formatTokenForBengali('042')).toBe('শূন্য চার দুই');
    expect(formatTokenForBengali('A-012')).toBe('এ শূন্য এক দুই');
    expect(formatTokenForBengali('GM-001')).toBe('জি এম শূন্য শূন্য এক');
    expect(formatTokenForBengali('OPD-005')).toBe('ও পি ডি শূন্য শূন্য পাঁচ');
  });

  it('formats room cleanly into respectful Bengali phrases', () => {
    expect(formatRoomForBengali('Room 02')).toBe('দুই নম্বর কক্ষে');
    expect(formatRoomForBengali('Room 1')).toBe('এক নম্বর কক্ষে');
    expect(formatRoomForBengali('Counter 3')).toBe('তিন নম্বর কাউন্টারে');
    expect(formatRoomForBengali('Consultation Room 04')).toBe('চার নম্বর পরামর্শ কক্ষে');
    expect(formatRoomForBengali('the consultation room')).toBe('পরামর্শ কক্ষে');
    expect(formatRoomForBengali(undefined)).toBe('পরামর্শ কক্ষে');
  });

  it('generates polite, privacy-safe hospital announcement text in Bengali without announcing patient names', async () => {
    const res = await announcePatientCalling({
      token: '001',
      patientName: 'Registered Patient',
      room: 'Room 02',
      language: 'bn',
    });

    expect(res.text).toBe('টোকেন নম্বর শূন্য শূন্য এক, দয়া করে দুই নম্বর কক্ষে আসুন।');
  });
});

