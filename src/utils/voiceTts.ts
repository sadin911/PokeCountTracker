/**
 * Fast Text-To-Speech (TTS) Voice Confirmation Engine
 * Provides immediate auditory feedback for voice dictation actions.
 */

export interface SpeakOptions {
  lang?: 'th-TH' | 'en-US' | string;
  rate?: number; // Speed multiplier (1.0 = normal, 1.4 = fast)
  pitch?: number;
  volume?: number;
}

const DEFAULT_RATE = 1.45; // Fast, crisp speech for rapid card collection
const DEFAULT_PITCH = 1.05;
const DEFAULT_VOLUME = 0.9;

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Mobile audio unlocker: can be called on first user gesture (e.g. clicking mic button)
 */
export function initTtsUnlock(): void {
  if (!isTtsSupported()) return;
  try {
    window.speechSynthesis.resume();
  } catch {
    // Ignore
  }
}

/**
 * Cancels any pending or active speech synthesis immediately
 */
export function stopVoiceFeedback(): void {
  if (!isTtsSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore
  }
}

/**
 * Speaks a short confirmation phrase with high speed.
 * Any previous utterance is cancelled immediately so audio cues never lag or queue up.
 */
export function speakVoiceFeedback(text: string, options: SpeakOptions = {}): void {
  if (!text || !isTtsSupported()) return;

  const {
    lang = 'th-TH',
    rate = DEFAULT_RATE,
    pitch = DEFAULT_PITCH,
    volume = DEFAULT_VOLUME,
  } = options;

  try {
    // 1. Cancel previous speech immediately
    window.speechSynthesis.cancel();

    // 2. Prepare new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Optional: Prefer matching voice if available in the browser voice list
    const voices = window.speechSynthesis.getVoices?.() || [];
    if (voices.length > 0) {
      const matchingVoice = voices.find((v) => v.lang.replace('_', '-') === lang || v.lang.startsWith(lang.slice(0, 2)));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    // 3. Dispatch speech
    window.speechSynthesis.speak(utterance);
  } catch {
    // Silent fail if browser restricts audio playback
  }
}

/**
 * Formats a card match into concise spoken phrase
 * e.g. "พิคาชู 1 ใบ", "ลิซาร์ดอน ex สองใบ", "มิวทู โฮโล 1 ใบ"
 */
export function formatCardSpokenText(
  cardName: string,
  quantity: number = 1,
  variant?: string,
  lang: 'th-TH' | 'en-US' = 'th-TH'
): string {
  const cleanName = (cardName || '').trim();
  if (lang === 'en-US') {
    const qtyText = quantity > 1 ? `${quantity} cards` : '1 card';
    const variantText = variant && variant !== 'normal' ? ` ${variant}` : '';
    return `${cleanName}${variantText}, ${qtyText}`;
  }

  // Thai
  const qtyText = quantity > 1 ? `${quantity} ใบ` : '1 ใบ';
  let variantText = '';
  if (variant === 'holo' || variant === 'reverse') {
    variantText = ' โฮโล';
  } else if (variant === 'promo') {
    variantText = ' โปรโม';
  }

  return `${cleanName}${variantText} ${qtyText}`;
}

/**
 * Formats a command action into concise spoken feedback
 */
export function formatCommandSpokenText(
  command: 'undo' | 'clear' | 'increase_last' | 'decrease_last' | 'confirm' | 'set_change' | 'timeout',
  detail?: string,
  lang: 'th-TH' | 'en-US' = 'th-TH'
): string {
  if (lang === 'en-US') {
    switch (command) {
      case 'undo':
        return detail ? `Undone ${detail}` : 'Undone';
      case 'clear':
        return 'Cleared all';
      case 'increase_last':
        return detail || 'Increased';
      case 'decrease_last':
        return detail || 'Decreased';
      case 'confirm':
        return 'Saved';
      case 'set_change':
        return `Set ${detail || ''}`;
      case 'timeout':
        return 'Timed out';
    }
  }

  // Thai
  switch (command) {
    case 'undo':
      return detail ? `ยกเลิก ${detail} แล้ว` : 'ยกเลิกแล้ว';
    case 'clear':
      return 'ล้างรายการแล้ว';
    case 'increase_last':
      return detail || 'เพิ่มจำนวนแล้ว';
    case 'decrease_last':
      return detail || 'ลดจำนวนแล้ว';
    case 'confirm':
      return 'บันทึกเรียบร้อย';
    case 'set_change':
      return `ชุด ${detail || ''}`;
    case 'timeout':
      return 'หมดเวลาฟังเสียง';
  }
}
