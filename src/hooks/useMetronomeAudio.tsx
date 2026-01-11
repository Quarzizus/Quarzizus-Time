import { useRef, useCallback, useEffect } from "react";
import { AudioContextManager, createClickBuffer } from "../lib/audioUtils";

export type SoundType = "accent" | "sub";

interface UseMetronomeAudioReturn {
  playSound: (type: SoundType, beat: number) => void;
  resumeContext: () => Promise<void>;
}

const useMetronomeAudio = (): UseMetronomeAudioReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const accentBufferRef = useRef<AudioBuffer | null>(null);
  const subBufferRef = useRef<AudioBuffer | null>(null);

  // Inicializar buffers de audio
  useEffect(() => {
    const initAudio = () => {
      const ctx = AudioContextManager.getContext();
      audioContextRef.current = ctx;
      accentBufferRef.current = createClickBuffer(ctx, 1200, 0.08);
      subBufferRef.current = createClickBuffer(ctx, 1200, 0.08);
    };
    initAudio();
  }, []);

  const resumeContext = useCallback(async () => {
    await AudioContextManager.resume();
  }, []);

  const playSound = useCallback((type: SoundType) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Asegurar que el contexto esté activo (requerido en navegadores modernos)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const buffer =
      type === "accent" ? accentBufferRef.current : subBufferRef.current;

    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = type === "accent" ? 0.8 : 0.3;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }, []);

  return {
    playSound,
    resumeContext,
  };
};

export { useMetronomeAudio };
