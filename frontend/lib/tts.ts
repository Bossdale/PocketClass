import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

/**
 * Picks the most seamless, natural-sounding English voice available on the device.
 *
 * iOS:     Prefers Ava/Samantha Enhanced (Neural) — must be downloaded from
 *          Settings → Accessibility → Spoken Content → Voices → English
 * Android: Prefers Google Studio → Wavenet → Neural voices automatically.
 */

export const getBestVoice = async (): Promise<string | undefined> => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const enVoices = voices.filter(v => v.language.startsWith('en'));

    // Priority 1: Enhanced/Neural voices (must be downloaded from
    // Settings → Accessibility → Spoken Content → Voices → English)
    const enhancedIds = [
      'com.apple.voice.enhanced.en-US.Ava',
      'com.apple.voice.enhanced.en-US.Samantha',
      'com.apple.voice.enhanced.en-US.Nicky',
      'com.apple.voice.enhanced.en-GB.Daniel',
      'com.apple.ttsbundle.Ava-premium',
      'com.apple.ttsbundle.Samantha-premium',
    ];
    for (const id of enhancedIds) {
      const match = enVoices.find(v => v.identifier === id);
      if (match) return match.identifier;
    }

    // Priority 2: Best from what your device currently has —
    // super-compact voices sound more natural than the novelty ones
    const currentDeviceIds = [
      'com.apple.voice.super-compact.en-GB.Daniel',  // most natural from your list
      'com.apple.voice.super-compact.en-AU.Karen',
      'com.apple.voice.super-compact.en-IE.Moira',
      'com.apple.voice.super-compact.en-ZA.Tessa',
      'com.apple.voice.super-compact.en-IN.Rishi',
      'com.apple.eloquence.en-GB.Reed',
      'com.apple.eloquence.en-GB.Shelley',
      'com.apple.eloquence.en-GB.Flo',
    ];
    for (const id of currentDeviceIds) {
      const match = enVoices.find(v => v.identifier === id);
      if (match) return match.identifier;
    }

    // Fallback: anything English
    return enVoices[0]?.identifier;
  } catch {
    return undefined;
  }
};

export interface SpeakOptions {
  rate?: number;   // 0.0 – 2.0, default 0.88
  pitch?: number;  // 0.5 – 2.0, default 1.0 (keep neutral)
  onDone?: () => void;
  onError?: () => void;
}

/**
 * Speak text using the best available voice on the device.
 * Drop-in replacement for Speech.speak() anywhere in the app.
 */
export const speak = async (text: string, options: SpeakOptions = {}) => {
  const {
    rate = 0.88,
    pitch = 1.0,
    onDone = () => {},
    onError = () => {},
  } = options;

  const voice = await getBestVoice();

  Speech.speak(text, {
    voice,   // undefined silently falls back to OS default
    rate,
    pitch,
    onDone,
    onError,
  });
};

/** Stop any currently playing speech. */
export const stopSpeaking = () => Speech.stop();

/** Returns true if speech is currently playing. */
export const isSpeaking = () => Speech.isSpeakingAsync();

// Temporary debug — call this once from any screen's useEffect to see real voice IDs
export const logAvailableVoices = async () => {
  const voices = await Speech.getAvailableVoicesAsync();
  const enVoices = voices.filter(v => v.language.startsWith('en'));
  console.log('=== AVAILABLE EN VOICES ===');
  enVoices.forEach(v => console.log(`id: ${v.identifier} | lang: ${v.language} | name: ${v.name}`));
};