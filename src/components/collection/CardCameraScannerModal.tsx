import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useCollectionStore } from '../../store/collectionStore';
import { matchOcrToCard, buildCardLookup } from '../../utils/cardOcrMatcher';
import { resolveCardImageUrl } from '../../utils/cardImage';
import pokemonCardData from '../../data/pokemonNames.json';
import type { CardVariantKey } from '../../types/collection';

interface Props {
  onClose: () => void;
  initialBinderId?: string;
}

interface ScannedHistoryItem {
  id: string;
  card: any;
  variant: CardVariantKey;
  timestamp: number;
}

function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // AudioContext blocked by browser autoplay policy
  }
}

function triggerHaptic() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([25, 40, 30]);
    }
  } catch {
    // ignore
  }
}

export function CardCameraScannerModal({ onClose, initialBinderId }: Props) {
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const switchProfile = useCollectionStore((s) => s.switchProfile);
  const incrementVariant = useCollectionStore((s) => s.incrementVariant);
  const decrementVariant = useCollectionStore((s) => s.decrementVariant);

  const [targetBinderId, setTargetBinderId] = useState(initialBinderId || activeProfileId);
  const [selectedVariant, setSelectedVariant] = useState<CardVariantKey>('normal');
  const [isScanning, setIsScanning] = useState(true);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);
  const [history, setHistory] = useState<ScannedHistoryItem[]>([]);
  const [lastDetectedSnippet, setLastDetectedSnippet] = useState<string | null>(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);
  const lastScannedCardRef = useRef<{ id: string; time: number } | null>(null);

  // Cached lookup table
  const cardLookupRef = useRef(buildCardLookup(pokemonCardData as any[]));

  // 1. Initialize Tesseract Worker dynamically
  useEffect(() => {
    let cancelled = false;

    async function initTesseract() {
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/-',
        });

        if (!cancelled) {
          workerRef.current = worker;
          setIsWorkerReady(true);
        } else {
          await worker.terminate();
        }
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(`ไม่สามารถโหลดระบบ OCR ได้: ${err.message || 'Error'}`);
        }
      }
    }

    initTesseract();

    return () => {
      cancelled = true;
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // 2. Start Camera Video Stream
  useEffect(() => {
    let active = true;

    async function startCamera() {
      setCameraError(null);
      // Stop old tracks first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง (mediaDevices not supported)');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        if (track && (track.getCapabilities as any)) {
          const caps = (track.getCapabilities as any)();
          setHasTorch(!!caps.torch);
        }
      } catch (err: any) {
        if (active) {
          setCameraError(err.message || 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์การใช้งานกล้อง');
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch {
      // ignore
    }
  };

  // 3. Process video frame through OCR
  const processFrame = useCallback(async () => {
    if (!isScanning || !isWorkerReady || isProcessingFrame || !videoRef.current || !workerRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    setIsProcessingFrame(true);

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;

      const vW = video.videoWidth;
      const vH = video.videoHeight;

      // The targeting reticle is in the center-lower region of the frame
      // Crop 40% width and 20% height around the reticle box
      const cropW = Math.round(vW * 0.45);
      const cropH = Math.round(vH * 0.22);
      const cropX = Math.round((vW - cropW) / 2);
      const cropY = Math.round(vH * 0.45);

      canvas.width = cropW;
      canvas.height = cropH;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Draw cropped ROI
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // Preprocessing: boost contrast & binarize
      const imgData = ctx.getImageData(0, 0, cropW, cropH);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // High contrast thresholding
        const val = avg > 115 ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);

      // Run OCR
      const ret = await workerRef.current.recognize(canvas);
      const text = (ret?.data?.text || '').trim();

      if (text) {
        setLastDetectedSnippet(text.slice(0, 35));
        const matched = matchOcrToCard(text, pokemonCardData as any[], cardLookupRef.current);

        if (matched.card) {
          const now = Date.now();
          const last = lastScannedCardRef.current;

          // Debounce: prevent adding same card multiple times within 2 seconds
          if (!last || last.id !== matched.card.id || now - last.time > 2000) {
            lastScannedCardRef.current = { id: matched.card.id, time: now };

            // 1. Add to collection
            if (targetBinderId !== activeProfileId) {
              switchProfile(targetBinderId);
            }
            incrementVariant(matched.card.id, selectedVariant);

            // 2. Sound & Haptic
            playSuccessChime();
            triggerHaptic();

            // 3. Visual Flash
            setScanFlash(true);
            setTimeout(() => setScanFlash(false), 500);

            // 4. Record to session history
            setHistory((prev) => [
              {
                id: `${matched.card.id}_${now}`,
                card: matched.card,
                variant: selectedVariant,
                timestamp: now,
              },
              ...prev,
            ]);
          }
        }
      }
    } catch {
      // OCR frame error, continue loop
    } finally {
      setIsProcessingFrame(false);
    }
  }, [isScanning, isWorkerReady, isProcessingFrame, targetBinderId, selectedVariant, incrementVariant]);

  // 4. Continuous Scanning Loop
  useEffect(() => {
    if (!isScanning || !isWorkerReady) return;

    const interval = setInterval(() => {
      processFrame();
    }, 600);

    return () => clearInterval(interval);
  }, [isScanning, isWorkerReady, processFrame]);

  // Handle manual photo file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerRef.current) return;

    try {
      setIsProcessingFrame(true);
      const ret = await workerRef.current.recognize(file);
      const text = (ret?.data?.text || '').trim();

      if (text) {
        setLastDetectedSnippet(text.slice(0, 35));
        const matched = matchOcrToCard(text, pokemonCardData as any[], cardLookupRef.current);

        if (matched.card) {
          const now = Date.now();
          if (targetBinderId !== activeProfileId) {
            switchProfile(targetBinderId);
          }
          incrementVariant(matched.card.id, selectedVariant);
          playSuccessChime();
          triggerHaptic();
          setScanFlash(true);
          setTimeout(() => setScanFlash(false), 500);

          setHistory((prev) => [
            {
              id: `${matched.card.id}_${now}`,
              card: matched.card,
              variant: selectedVariant,
              timestamp: now,
            },
            ...prev,
          ]);
        } else {
          alert(`ตรวจพบข้อความ "${text}" แต่ไม่ตรงกับรหัสชุดหรือเลขการ์ดในระบบ`);
        }
      } else {
        alert('ไม่สามารถอ่านตัวอักษรจากภาพนี้ได้ กรุณาลองถ่ายภาพที่เห็นรหัสการ์ดมุมซ้ายล่างชัดเจน');
      }
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message || 'Error'}`);
    } finally {
      setIsProcessingFrame(false);
      e.target.value = '';
    }
  };

  const handleUndo = (item: ScannedHistoryItem) => {
    if (targetBinderId !== activeProfileId) {
      switchProfile(targetBinderId);
    }
    decrementVariant(item.card.id, item.variant);
    setHistory((prev) => prev.filter((h) => h.id !== item.id));
  };

  const targetProfile = profiles[targetBinderId];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-testid="camera-scanner-modal"
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-slate-100 select-none animate-in fade-in duration-200"
    >
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">📷</span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white truncate flex items-center gap-2">
              <span>สแกนกล้องต่อเนื่อง (Continuous OCR)</span>
              {scanFlash && (
                <span className="px-2 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black animate-pulse">
                  ✓ เพิ่มแล้ว!
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              ส่องไปที่รหัสชุดและเลขการ์ด (มุมซ้ายล่าง) เพื่อเพิ่มเข้าคลังทันที
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-xl border text-sm transition-colors ${
                torchOn
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="เปิด/ปิดไฟฉาย"
            >
              🔦
            </button>
          )}

          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
            title="สลับกล้องหน้า/หลัง"
          >
            🔄
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 hover:bg-rose-600 hover:border-rose-500 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
            title="ปิดหน้าต่างสแกน (ESC)"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Main Viewport & Camera */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {cameraError ? (
          <div className="p-6 text-center max-w-md space-y-4">
            <span className="text-5xl block">⚠️</span>
            <p className="text-rose-400 text-sm font-semibold">{cameraError}</p>
            <div className="pt-2 flex flex-col gap-2">
              <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm cursor-pointer shadow-lg inline-flex items-center justify-center gap-2">
                <span>📁 เลือกภาพถ่ายจากการ์ดเพื่อสแกน</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Targeting Reticle & Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Dimmed surrounding */}
              <div className="relative w-full max-w-sm px-6 flex flex-col items-center">
                {/* Aiming Reticle Box */}
                <div
                  className={`relative w-full aspect-[2.4/1] rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                    scanFlash
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-2xl shadow-emerald-500/50 scale-105'
                      : isScanning
                      ? 'border-indigo-400/90 bg-indigo-950/20 shadow-xl shadow-black/60'
                      : 'border-slate-600 bg-black/40'
                  }`}
                >
                  {/* Corner brackets */}
                  <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
                  <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
                  <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
                  <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

                  <div className="text-center px-4 space-y-1">
                    <span className="text-[11px] font-mono font-black text-amber-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-amber-400/30 inline-block shadow">
                      [ รหัสชุด ] เช่น SV8a 025/187
                    </span>
                    <p className="text-[10px] text-slate-200 font-medium drop-shadow">
                      เล็งมุมซ้ายล่างของการ์ดไว้ในกรอบนี้
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Live Status pill */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700/80 shadow-lg text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isScanning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className="font-bold text-slate-200">
                {isScanning ? 'กำลังสแกนสดอัตโนมัติ...' : 'พักการสแกนชั่วคราว'}
              </span>
              {lastDetectedSnippet && (
                <span className="text-slate-400 font-mono text-[9px] border-l border-slate-700 pl-2 max-w-[120px] truncate">
                  {lastDetectedSnippet}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Control & Configuration Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 space-y-3 shrink-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Target Binder Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">บันทึกลง:</span>
            <select
              value={targetBinderId}
              onChange={(e) => {
                const newId = e.target.value;
                setTargetBinderId(newId);
                switchProfile(newId);
              }}
              className="h-8 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {Object.values(profiles).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon || '🎴'} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Variant Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedVariant('normal')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                selectedVariant === 'normal'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ธรรมดา
            </button>
            <button
              type="button"
              onClick={() => setSelectedVariant('holo')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                selectedVariant === 'holo'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              โฮโล
            </button>
            <button
              type="button"
              onClick={() => setSelectedVariant('reverse')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                selectedVariant === 'reverse'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              รีเวิร์ส
            </button>
          </div>

          {/* Pause / Resume Button & File Upload fallback */}
          <div className="flex items-center gap-2">
            <label className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors">
              <span>📁 รูปภาพ</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setIsScanning((prev) => !prev)}
              className={`h-8 px-3.5 rounded-lg font-black text-xs flex items-center gap-1.5 shadow transition-all ${
                isScanning
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{isScanning ? '⏸️ หยุดสแกน' : '▶️ สแกนต่อ'}</span>
            </button>
          </div>
        </div>

        {/* Scanned Items Feed (Horizontal list of recently scanned cards) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>รายการที่เพิ่มแล้วในรอบนี้ ({history.length} ใบ)</span>
            </span>
            {history.length > 0 && (
              <span className="text-[10px] text-slate-500">
                เพิ่มลงสมุด "{targetProfile?.name}" อัตโนมัติแล้ว
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-3 text-center text-xs text-slate-500 font-medium">
              ยังไม่มีการ์ดที่สแกน — เพียงถือการ์ดให้อยู่ในกรอบ ระบบจะเพิ่มการ์ดเข้าคลังให้อัตโนมัติ
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-h-24">
              {history.map((item) => {
                const img = resolveCardImageUrl(item.card.imageUrl);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 shrink-0 shadow animate-in slide-in-from-left-2 duration-200"
                  >
                    <div className="w-8 h-11 rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                      {img && (
                        <img
                          src={img}
                          alt={item.card.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1 text-[9px] text-amber-400 font-mono font-bold">
                        <span>{item.card.set?.id || 'PROMO'}</span>
                        <span>{item.card.collectorNumber || item.card.localId}</span>
                      </div>
                      <p className="text-[11px] font-bold text-white max-w-[100px] truncate">
                        {item.card.name}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[9px] text-indigo-300 font-semibold">
                          +{item.variant === 'normal' ? 'ธรรมดา' : item.variant === 'holo' ? 'โฮโล' : 'รีเวิร์ส'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUndo(item)}
                          className="text-[9px] text-rose-400 hover:text-rose-300 underline font-semibold"
                          title="ยกเลิกใบนี้ (ลดจำนวน -1)"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
