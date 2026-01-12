import { useRef, useCallback, useEffect } from "react";
import { createClickBuffer } from "../lib/audioUtils";
import { audioClock } from "../lib/audioClock";

export type SoundType = "accent" | "sub";

interface UseMetronomeAudioReturn {
  playSoundAtTargetTime: (type: SoundType, beat: number, targetTime: number) => void;
}

const useMetronomeAudio = (): UseMetronomeAudioReturn => {
  const accentBufferRef = useRef<AudioBuffer | null>(null);
  const subBufferRef = useRef<AudioBuffer | null>(null);

  // Inicializar buffers de audio
  useEffect(() => {
    const initAudio = () => {
      const ctx = audioClock.getContext();
      accentBufferRef.current = createClickBuffer(ctx, 1200, 0.08);
      subBufferRef.current = createClickBuffer(ctx, 1200, 0.08);
    };
    initAudio();
  }, []);

  const playSoundAtTargetTime = useCallback((type: SoundType, _beat: number, targetTime: number) => {
    const ctx = audioClock.getContext();

    // Asegurar que el contexto esté activo
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const buffer =
      type === "accent" ? accentBufferRef.current : subBufferRef.current;

    if (!buffer) return;

    // Convertir targetTime (performance.now) a tiempo de audio
    const audioTime = audioClock.getAudioTime(targetTime);
    
    // Si el tiempo de audio ya pasó (más de 50ms en el pasado), reproducir inmediatamente
    const nowAudio = ctx.currentTime;
    if (audioTime < nowAudio - 0.05) {
      // Demasiado tarde, reproducir ahora
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = type === "accent" ? 0.8 : 0.3;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(nowAudio);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = type === "accent" ? 0.8 : 0.3;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(audioTime);
  }, []);

  return {
    playSoundAtTargetTime,
  };
};

export { useMetronomeAudio };
