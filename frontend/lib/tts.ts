import * as Speech from 'expo-speech';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

// ── Active poll handle — cleared by stopSpeaking() ───────────────────────────
let activePollInterval: ReturnType<typeof setInterval> | null = null;

function clearActivePoll() {
  if (activePollInterval !== null) {
    clearInterval(activePollInterval);
    activePollInterval = null;
  }
}

// ── Voice selection ───────────────────────────────────────────────────────────

export const getBestVoice = async (): Promise<string | undefined> => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    // iOS — prefer enhanced/neural English voices
    const iosPreferred = [
      'com.apple.voice.enhanced.en-US.Ava',
      'com.apple.voice.enhanced.en-US.Samantha',
      'com.apple.voice.compact.en-US.Samantha',
      'Samantha',
      'Daniel',
    ];
    for (const id of iosPreferred) {
      if (voices.find(v => v.identifier === id)) return id;
    }

    // Android — prefer high-quality network voices
    const androidKeywords = ['studio', 'wavenet', 'neural', 'enhanced', 'premium', 'network'];
    for (const kw of androidKeywords) {
      const match = voices.find(
        v => v.language?.startsWith('en') && v.identifier?.toLowerCase().includes(kw)
      );
      if (match) return match.identifier;
    }

    // Fallback — any English voice
    const anyEn = voices.find(v => v.language?.startsWith('en'));
    return anyEn?.identifier;
  } catch {
    return undefined;
  }
};

// ── Core speak function with polling fallback ─────────────────────────────────
//
// WHY POLLING:
//   expo-speech's onDone callback is unreliable on physical iOS devices when
//   running inside Expo Go. It fires correctly in simulators but on real
//   hardware it often never fires, silently breaking any logic placed inside it
//   (e.g. fetching and speaking the AI follow-up explanation).
//
//   The fix: we register onDone with Speech.speak() as normal, but ALSO start
//   a setInterval that polls Speech.isSpeakingAsync() every 600ms. Whichever
//   fires first triggers the completion handler. A `doneFired` flag ensures the
//   handler only runs once.

export const speak = async (text: string, options: SpeakOptions = {}): Promise<void> => {
  // Clear any previous poll before starting a new utterance
  clearActivePoll();

  const voice = await getBestVoice();

  // One-shot guard — prevents onDone + poll from both firing
  let doneFired = false;

  const handleDone = () => {
    if (doneFired) return;
    doneFired = true;
    clearActivePoll();
    options.onDone?.();
  };

  const handleError = (error: Error) => {
    doneFired = true;
    clearActivePoll();
    options.onError?.(error);
  };

  // Start speaking — pass onDone in case it works (simulator / some Android)
  Speech.speak(text, {
    voice,
    rate:    options.rate  ?? 0.88,
    pitch:   options.pitch ?? 1.0,
    onDone:  options.onDone  ? handleDone  : undefined,
    onError: options.onError ? handleError : undefined,
  });

  // Polling fallback — only set up if caller cares about completion
  if (options.onDone) {
    // Short initial delay so isSpeakingAsync() has time to return true
    await new Promise(resolve => setTimeout(resolve, 400));

    activePollInterval = setInterval(async () => {
      try {
        const stillSpeaking = await Speech.isSpeakingAsync();
        if (!stillSpeaking) {
          handleDone();
        }
      } catch {
        // isSpeakingAsync can fail on some devices — stop polling silently
        clearActivePoll();
      }
    }, 600);
  }
};

// ── Stop — also kills the poll so handleDone never fires after manual stop ────
export const stopSpeaking = (): void => {
  clearActivePoll();
  Speech.stop();
};

export const isSpeaking = (): Promise<boolean> => Speech.isSpeakingAsync();

export const logAvailableVoices = async (): Promise<void> => {
  const voices = await Speech.getAvailableVoicesAsync();
  console.log('Available voices:', voices.map(v => `${v.identifier} (${v.language})`));
};