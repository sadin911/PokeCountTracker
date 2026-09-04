import { useState, useEffect, useRef, useCallback } from 'react';

// Web Audio API Success Chime
export function playVoiceSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // AudioContext autoplay policy or browser restriction
  }
}

// Low blip for voice command / set change
export function playVoiceCommandChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08); // C#5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore
  }
}

export function triggerVoiceHaptic(type: 'success' | 'command' | 'error' = 'success') {
  try {
    if (!navigator.vibrate) return;
    if (type === 'success') {
      navigator.vibrate([25, 40, 25]);
    } else if (type === 'command') {
      navigator.vibrate([35]);
    } else {
      navigator.vibrate([50, 60, 50]);
    }
  } catch {
    // Ignore
  }
}

export interface UseVoiceCardRecognitionOptions {
  onFinalResult?: (transcript: string) => void;
  continuous?: boolean;
}

export function useVoiceCardRecognition({
  onFinalResult,
  continuous = true,
}: UseVoiceCardRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [language, setLanguage] = useState<'th-TH' | 'en-US'>('th-TH');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastFinalTranscript, setLastFinalTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const onFinalResultRef = useRef(onFinalResult);

  onFinalResultRef.current = onFinalResult;

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup audio & recognition
  const stopAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startAudioAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current || !isListeningRef.current) {
          setAudioLevel(0);
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize 0 to 1 with non-linear boost
        const normalized = Math.min(1, (avg / 128) * 1.5);
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // User may have denied mic or browser unsupported, recognition can still attempt to work
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    stopAudioAnalyser();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
  }, [stopAudioAnalyser]);

  const startListening = useCallback(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setError('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งการด้วยเสียง กรุณาใช้ Chrome, Edge หรือ Safari');
      setIsSupported(false);
      return;
    }

    setError(null);
    stopListening();

    try {
      const rec = new SpeechRec();
      rec.continuous = continuous;
      rec.interimResults = true;
      rec.lang = language;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        startAudioAnalyser();
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalStr += trans;
          } else {
            interim += trans;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (finalStr.trim()) {
          const cleaned = finalStr.trim();
          setLastFinalTranscript(cleaned);
          setInterimTranscript('');
          if (onFinalResultRef.current) {
            onFinalResultRef.current(cleaned);
          }
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'no-speech') {
          // Expected when quiet, ignore in continuous mode
          return;
        }
        if (e.error === 'not-allowed') {
          setError('กรุณาอนุญาตการเข้าถึงไมโครโฟนเพื่อใช้งานระบบเสียง');
          stopListening();
          return;
        }
        setError(`ข้อผิดพลาดการรู้จำเสียง: ${e.error || 'Unknown'}`);
      };

      rec.onend = () => {
        // Auto-restart if user intends to stay in continuous listening mode
        if (isListeningRef.current && continuous) {
          try {
            rec.start();
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
            stopAudioAnalyser();
          }
        } else {
          isListeningRef.current = false;
          setIsListening(false);
          stopAudioAnalyser();
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      setError(`ไม่สามารถเปิดใช้งานไมโครโฟนได้: ${err?.message || 'Error'}`);
      isListeningRef.current = false;
      setIsListening(false);
      stopAudioAnalyser();
    }
  }, [continuous, language, startAudioAnalyser, stopAudioAnalyser, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Restart recognition if language changes while listening
  useEffect(() => {
    if (isListeningRef.current) {
      startListening();
    }
  }, [language, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      stopAudioAnalyser();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [stopAudioAnalyser]);

  return {
    isSupported,
    isListening,
    language,
    setLanguage,
    startListening,
    stopListening,
    toggleListening,
    interimTranscript,
    lastFinalTranscript,
    audioLevel,
    error,
  };
}
