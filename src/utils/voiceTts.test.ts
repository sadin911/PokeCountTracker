import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isTtsSupported,
  formatCardSpokenText,
  formatCommandSpokenText,
  speakVoiceFeedback,
  stopVoiceFeedback,
  initTtsUnlock,
} from './voiceTts';

describe('voiceTts', () => {
  describe('formatCardSpokenText', () => {
    it('formats normal card with 1 quantity in Thai', () => {
      const result = formatCardSpokenText('พิคาชู', 1, 'normal', 'th-TH');
      expect(result).toBe('พิคาชู 1 ใบ');
    });

    it('formats holo card with multiple quantities in Thai', () => {
      const result = formatCardSpokenText('ลิซาร์ดอน ex', 2, 'holo', 'th-TH');
      expect(result).toBe('ลิซาร์ดอน ex โฮโล 2 ใบ');
    });

    it('formats reverse holo and promo variants', () => {
      expect(formatCardSpokenText('อีวุย', 1, 'reverse', 'th-TH')).toBe('อีวุย โฮโล 1 ใบ');
      expect(formatCardSpokenText('พิคาชู', 3, 'promo', 'th-TH')).toBe('พิคาชู โปรโม 3 ใบ');
    });

    it('formats card in English', () => {
      expect(formatCardSpokenText('Pikachu', 1, 'normal', 'en-US')).toBe('Pikachu, 1 card');
      expect(formatCardSpokenText('Charizard ex', 2, 'holo', 'en-US')).toBe('Charizard ex holo, 2 cards');
    });
  });

  describe('formatCommandSpokenText', () => {
    it('formats Thai command texts', () => {
      expect(formatCommandSpokenText('undo', 'พิคาชู', 'th-TH')).toBe('ยกเลิก พิคาชู แล้ว');
      expect(formatCommandSpokenText('clear', undefined, 'th-TH')).toBe('ล้างรายการแล้ว');
      expect(formatCommandSpokenText('set_change', 'SV8', 'th-TH')).toBe('ชุด SV8');
      expect(formatCommandSpokenText('confirm', undefined, 'th-TH')).toBe('บันทึกเรียบร้อย');
      expect(formatCommandSpokenText('timeout', undefined, 'th-TH')).toBe('หมดเวลาฟังเสียง');
    });

    it('formats English command texts', () => {
      expect(formatCommandSpokenText('undo', 'Pikachu', 'en-US')).toBe('Undone Pikachu');
      expect(formatCommandSpokenText('clear', undefined, 'en-US')).toBe('Cleared all');
      expect(formatCommandSpokenText('set_change', 'SV8', 'en-US')).toBe('Set SV8');
    });
  });

  describe('synthesis interaction in mock browser environment', () => {
    let mockCancel: any;
    let mockSpeak: any;
    let mockResume: any;

    beforeEach(() => {
      mockCancel = vi.fn();
      mockSpeak = vi.fn();
      mockResume = vi.fn();

      (window as any).speechSynthesis = {
        cancel: mockCancel,
        speak: mockSpeak,
        resume: mockResume,
        getVoices: vi.fn().mockReturnValue([]),
      };

      (window as any).SpeechSynthesisUtterance = class {
        text: string;
        lang: string = '';
        rate: number = 1;
        pitch: number = 1;
        volume: number = 1;
        constructor(text: string) {
          this.text = text;
        }
      };
    });

    afterEach(() => {
      delete (window as any).speechSynthesis;
      delete (window as any).SpeechSynthesisUtterance;
    });

    it('detects TTS support when APIs are present', () => {
      expect(isTtsSupported()).toBe(true);
    });

    it('speaks feedback with fast default rate and cancels prior speech', () => {
      speakVoiceFeedback('พิคาชู 1 ใบ');

      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(mockSpeak).toHaveBeenCalledTimes(1);

      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.text).toBe('พิคาชู 1 ใบ');
      expect(utterance.lang).toBe('th-TH');
      expect(utterance.rate).toBeGreaterThanOrEqual(1.4); // fast speech
    });

    it('allows custom options and stops voice feedback', () => {
      speakVoiceFeedback('Pikachu', { lang: 'en-US', rate: 1.8 });
      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.lang).toBe('en-US');
      expect(utterance.rate).toBe(1.8);

      stopVoiceFeedback();
      expect(mockCancel).toHaveBeenCalled();
    });

    it('unlocks audio on initTtsUnlock', () => {
      initTtsUnlock();
      expect(mockResume).toHaveBeenCalled();
    });
  });
});
