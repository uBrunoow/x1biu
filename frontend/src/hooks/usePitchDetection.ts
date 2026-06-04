"use client";

import { useCallback, useRef, useState } from "react";

interface PitchDetectionHook {
  hz: number | null;
  isListening: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

// Detecta frequência fundamental via autocorrelação — sem dependências externas
function detectPitchHz(buffer: Float32Array, sampleRate: number): number | null {
  // Descarta frames silenciosos
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  if (Math.sqrt(rms / buffer.length) < 0.015) return null;

  const half = Math.floor(buffer.length / 2);
  let bestOffset = -1;
  let bestCorr = 0;
  let lastCorr = 1;
  let foundGood = false;

  for (let offset = 1; offset < half; offset++) {
    let corr = 0;
    for (let i = 0; i < half; i++) corr += Math.abs(buffer[i] - buffer[i + offset]);
    corr = 1 - corr / half;

    if (corr > 0.9 && corr > lastCorr) {
      foundGood = true;
      if (corr > bestCorr) { bestCorr = corr; bestOffset = offset; }
    } else if (foundGood) {
      break;
    }
    lastCorr = corr;
  }

  if (bestOffset === -1) return null;

  const hz = sampleRate / bestOffset;
  // Faixa realista para assobio humano
  return hz >= 500 && hz <= 4000 ? hz : null;
}

export function usePitchDetection(): PitchDetectionHook {
  const [hz, setHz] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    ctxRef.current = null;
    setIsListening(false);
    setHz(null);
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    streamRef.current = stream;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);

    setIsListening(true);

    const buffer = new Float32Array(analyser.fftSize);
    function loop() {
      analyser.getFloatTimeDomainData(buffer);
      setHz(detectPitchHz(buffer, ctx.sampleRate));
      rafRef.current = requestAnimationFrame(loop);
    }
    loop();
  }, []);

  return { hz, isListening, start, stop };
}
