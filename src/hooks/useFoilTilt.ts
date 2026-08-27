import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** Maximum tilt angle along either axis. */
const MAX_TILT_DEG = 14;
/** Tracking duration during active pointer movement (smooth interpolation). */
const TRACK_MS = 60;
/** Transition duration when pointer leaves the card (spring-like return). */
const RELEASE_MS = 480;

/** Handset deadzone: tilt deltas smaller than this are ignored. */
const GYRO_DEADZONE_DEG = 1.2;
/** Handset max delta clamp. */
const GYRO_MAX_DELTA_DEG = 35;
/** Smoothing factor for requestAnimationFrame easing loop (0..1). */
const GYRO_SMOOTHING = 0.12;
/** Gyro gain multiplier. */
const GYRO_GAIN = 0.9;
/** Sign adjustment for gyro rotation. */
const GYRO_SIGN = 1;

export type GyroStatus = 'unsupported' | 'idle' | 'active' | 'denied';

interface Options {
  /**
   * Set true when viewing an individual card (e.g. Card Detail Modal).
   * Disabled by default to avoid triggering 60+ cards simultaneously in a grid.
   */
  gyro?: boolean;
}

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function useFoilTilt<T extends HTMLElement>(
  enabled: boolean,
  options: Options = {}
): {
  ref: RefObject<T | null>;
  onPointerMove: (e: { clientX: number; clientY: number }) => void;
  onPointerLeave: () => void;
  gyro: {
    status: GyroStatus;
    enable: () => Promise<void>;
    needsGesture: boolean;
  };
} {
  const ref = useRef<T | null>(null);
  const frame = useRef<number>(0);
  const { gyro: gyroAllowed = false } = options;

  const pointerDrives = useRef(false);
  const reducedMotion = useRef(false);
  const [gyroStatus, setGyroStatus] = useState<GyroStatus>('unsupported');

  const write = useCallback(
    (rx: number, ry: number, mx: number, my: number, on: number, durMs: number) => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--foil-rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--foil-ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--foil-mx', `${mx.toFixed(1)}%`);
      el.style.setProperty('--foil-my', `${my.toFixed(1)}%`);
      el.style.setProperty('--foil-sx', `${(-ry * 1.1).toFixed(1)}px`);
      el.style.setProperty('--foil-sy', `${(rx * 1.1 + 8).toFixed(1)}px`);
      el.style.setProperty('--foil-on', String(on));
      el.style.setProperty('--foil-dur', `${durMs}ms`);
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedMotion.current = reduced.matches;
      pointerDrives.current = fine.matches && !reduced.matches;
    };
    sync();
    fine.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    return () => {
      fine.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
    };
  }, [enabled]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // --- Pointer (Desktop Mouse) -----------------------------------------------

  const onPointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      if (!pointerDrives.current) return;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        write(
          (0.5 - py) * 2 * MAX_TILT_DEG,
          (px - 0.5) * 2 * MAX_TILT_DEG,
          px * 100,
          py * 100,
          1,
          TRACK_MS
        );
      });
    },
    [write]
  );

  const onPointerLeave = useCallback(() => {
    if (!pointerDrives.current) return;
    cancelAnimationFrame(frame.current);
    write(0, 0, 50, 50, 0, RELEASE_MS);
  }, [write]);

  // --- Gyroscope (Mobile Handset) --------------------------------------------

  useEffect(() => {
    if (!enabled || !gyroAllowed) return;
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setGyroStatus('unsupported');
      return;
    }
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setGyroStatus(coarse && !reduced ? 'idle' : 'unsupported');
  }, [enabled, gyroAllowed]);

  const listening = useRef(false);
  const easeFrame = useRef(0);

  const startGyro = useCallback(() => {
    if (listening.current) return undefined;
    listening.current = true;

    let baseline: { beta: number; gamma: number } | null = null;
    const target = { rx: 0, ry: 0 };
    const shown = { rx: 0, ry: 0 };
    const clamp = (v: number) => Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, v));

    const onOrientation = (e: DeviceOrientationEvent) => {
      const { beta, gamma } = e;
      if (beta === null || gamma === null) return;
      if (!baseline) {
        baseline = { beta, gamma };
        return;
      }

      let dx = beta - baseline.beta;
      let dy = gamma - baseline.gamma;
      if (Math.abs(dx) > GYRO_MAX_DELTA_DEG || Math.abs(dy) > GYRO_MAX_DELTA_DEG) return;

      const off = Math.hypot(dx, dy);
      if (off <= GYRO_DEADZONE_DEG) {
        dx = 0;
        dy = 0;
      } else {
        const past = (off - GYRO_DEADZONE_DEG) / off;
        dx *= past;
        dy *= past;
      }

      const angle = window.screen?.orientation?.angle ?? 0;
      if (angle === 90) [dx, dy] = [dy, -dx];
      else if (angle === 180) [dx, dy] = [-dx, -dy];
      else if (angle === 270) [dx, dy] = [-dy, dx];

      target.rx = clamp(GYRO_SIGN * dx * GYRO_GAIN);
      target.ry = clamp(GYRO_SIGN * dy * GYRO_GAIN);
    };

    const ease = () => {
      const dRx = target.rx - shown.rx;
      const dRy = target.ry - shown.ry;
      if (Math.abs(dRx) > 0.02 || Math.abs(dRy) > 0.02) {
        shown.rx += dRx * GYRO_SMOOTHING;
        shown.ry += dRy * GYRO_SMOOTHING;
        const { rx, ry } = shown;
        const lean = Math.min(1, Math.hypot(rx, ry) / (MAX_TILT_DEG * 0.6));
        write(rx, ry, 50 + (ry / MAX_TILT_DEG) * 45, 50 - (rx / MAX_TILT_DEG) * 45, lean, 0);
      }
      easeFrame.current = requestAnimationFrame(ease);
    };

    window.addEventListener('deviceorientation', onOrientation);
    easeFrame.current = requestAnimationFrame(ease);
    setGyroStatus('active');
    return onOrientation;
  }, [write]);

  const stopGyroRef = useRef<((e: DeviceOrientationEvent) => void) | undefined>(undefined);

  const enableGyro = useCallback(async () => {
    const Ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic | undefined;
    if (typeof Ctor?.requestPermission === 'function') {
      try {
        const result = await Ctor.requestPermission();
        if (result !== 'granted') {
          setGyroStatus('denied');
          return;
        }
      } catch {
        setGyroStatus('denied');
        return;
      }
    }
    stopGyroRef.current = startGyro();
  }, [startGyro]);

  useEffect(() => {
    if (gyroStatus !== 'idle') return;
    const Ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic | undefined;
    if (typeof Ctor?.requestPermission === 'function') return;
    stopGyroRef.current = startGyro();
  }, [gyroStatus, startGyro]);

  useEffect(
    () => () => {
      if (stopGyroRef.current) window.removeEventListener('deviceorientation', stopGyroRef.current);
      cancelAnimationFrame(easeFrame.current);
      listening.current = false;
    },
    []
  );

  return {
    ref,
    onPointerMove,
    onPointerLeave,
    gyro: {
      status: gyroStatus,
      enable: enableGyro,
      needsGesture: gyroStatus === 'idle',
    },
  };
}
