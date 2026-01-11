import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioScheduler } from "./useAudioScheduler";
import { AudioContextManager, createClickBuffer } from "../lib/audioUtils";
import { secondsPerBeat, calculateBpmFromIntervals } from "../lib/mathUtils";

export interface MetronomeState {
  bpm: number;
  beatsPerBar: number;
  subdivision: number; // 1 = quarter, 2 = eighth, 3 = triplet
  onBars: number | null;
  offBars: number | null;
  gapActive: boolean;
  isRunning: boolean;
}

export function useMetronomeEngine() {
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [onBars, setOnBars] = useState<number | null>(4);
  const [offBars, setOffBars] = useState<number | null>(2);
  const [gapActive, setGapActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Visual state
  const [currentBeat, setCurrentBeat] = useState(0);
  // const [currentBar, setCurrentBar] = useState(1);
  const [isGap, setIsGap] = useState(false);

  // Refs
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const currentBarRef = useRef(0);
  const visualQueueRef = useRef<
    { time: number; beat: number; bar: number; isGap: boolean }[]
  >([]);

  const clickBufferRef = useRef<AudioBuffer | null>(null);
  const accentBufferRef = useRef<AudioBuffer | null>(null);
  const subBufferRef = useRef<AudioBuffer | null>(null); // Buffer for subdivisions (softer)

  // Tap Tempo Refs
  const tapBufferRef = useRef<number[]>([]);
  const lastTapTimeRef = useRef<number>(0);

  // Persistence (Load)
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("metronome-settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.bpm) setBpm(parsed.bpm);
          if (parsed.beatsPerBar) setBeatsPerBar(parsed.beatsPerBar);
          if (parsed.subdivision) setSubdivision(parsed.subdivision);
          if (parsed.onBars !== undefined) setOnBars(parsed.onBars);
          if (parsed.offBars !== undefined) setOffBars(parsed.offBars);
          if (parsed.gapActive !== undefined) setGapActive(parsed.gapActive);
        }
      } catch (e) {
        console.warn("Failed to load metronome settings", e);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Persistence (Save)
  useEffect(() => {
    const settings = {
      bpm,
      beatsPerBar,
      subdivision,
      onBars,
      offBars,
      gapActive,
    };
    localStorage.setItem("metronome-settings", JSON.stringify(settings));
  }, [bpm, beatsPerBar, subdivision, onBars, offBars, gapActive]);

  // Initialize audio buffers
  useEffect(() => {
    const initAudio = () => {
      const ctx = AudioContextManager.getContext();
      // Accent: High pitch (Agudo) per user request "pulso fuerte levemente más agudo"
      // Standard/Subdivision: Lower pitch
      accentBufferRef.current = createClickBuffer(ctx, 750, 0.05);
      clickBufferRef.current = createClickBuffer(ctx, 700, 0.05);
      subBufferRef.current = createClickBuffer(ctx, 400, 0.05);
    };
    initAudio();
  }, []);

  const scheduleNote = useCallback(
    (
      context: AudioContext,
      time: number,
      type: "accent" | "beat" | "sub",
      mute: boolean
    ) => {
      if (mute) return;

      const source = context.createBufferSource();
      if (type === "accent") source.buffer = accentBufferRef.current;
      else if (type === "beat") source.buffer = clickBufferRef.current;
      else source.buffer = subBufferRef.current;

      const gain = context.createGain();
      // Accent louder, beats medium, subs softer
      if (type === "accent") gain.gain.value = 1.0;
      else if (type === "beat") gain.gain.value = 0.8;
      else gain.gain.value = 0.6;

      source.connect(gain);
      gain.connect(context.destination);
      source.start(time);
    },
    []
  );

  const onTick = useCallback(
    (context: AudioContext) => {
      const scheduleAheadTime = 0.1;

      // 6/8 Logic:
      // If beatsPerBar is 6, we treat it as Compound Ternary.
      // 2 big beats (dotted quarters), each subdivided into 3 eighth notes.
      // Total 6 ticks per bar if no extra subdivision selected.

      // Standard Logic:
      // beatsPerBar (e.g. 4) * subdivision (e.g. 2 for eighths)

      const isCompound = beatsPerBar === 6;

      let ticksPerBar: number;
      let interval: number;

      if (isCompound) {
        // 6/8 at a given BPM usually means the dotted quarter note gets the beat?
        // Or the eighth note gets the beat?
        // In standard metronomes, "BPM" for 6/8 often refers to the DOTTED QUARTER note (the main pulse).
        // So if BPM = 60, we have 60 dotted quarters per minute.
        // Each dotted quarter = 3 eighth notes.
        // So eighth note interval = (60 / BPM) / 3.

        const beatInterval = secondsPerBeat(bpm); // Time for one dotted quarter
        interval = beatInterval / 3; // Time for one eighth note

        // We don't support further subdivision of the eighth note yet for 6/8 in this simple engine
        // If subdivision > 1, we could divide interval further, but let's stick to basic 6/8 pulses first.
        ticksPerBar = 6;
      } else {
        // Standard Simple Time
        const beatInterval = secondsPerBeat(bpm);
        ticksPerBar = beatsPerBar * subdivision;
        interval = beatInterval / subdivision;
        if (subdivision === 3) {
          // Triplet feel in simple time (e.g. 4/4 triplets)
          interval = beatInterval / 3;
        }
      }

      while (
        nextNoteTimeRef.current <
        context.currentTime + scheduleAheadTime
      ) {
        const tickInBar = currentBeatRef.current; // 0..ticksPerBar-1
        let type: "accent" | "beat" | "sub" = "sub";

        if (isCompound) {
          // 6/8 Pattern: Strong - weak - weak - Strong (Medium) - weak - weak
          // Indices: 0 1 2 3 4 5
          if (tickInBar === 0) type = "accent";
          else if (tickInBar === 3) type = "beat"; // Secondary strong beat
          else type = "sub";
        } else {
          // Simple Time
          // If it's the start of a beat (index % subdivision == 0)
          const isBeatStart = tickInBar % subdivision === 0;

          if (tickInBar === 0) type = "accent";
          else if (isBeatStart) type = "beat";
          else type = "sub";
        }

        // Gap Logic
        let inGap = false;
        const hasValidGapValues =
          onBars !== null && offBars !== null && onBars >= 1 && offBars >= 1;
        if (gapActive && hasValidGapValues) {
          const cycle = onBars + offBars;
          const cyclePos = currentBarRef.current % cycle;
          if (cyclePos >= onBars) inGap = true;
        }

        scheduleNote(context, nextNoteTimeRef.current, type, inGap);

        visualQueueRef.current.push({
          time: nextNoteTimeRef.current,
          beat: currentBeatRef.current,
          bar: currentBarRef.current + 1,
          isGap: inGap,
        });

        nextNoteTimeRef.current += interval;
        currentBeatRef.current++;

        if (currentBeatRef.current >= ticksPerBar) {
          currentBeatRef.current = 0;
          currentBarRef.current++;
        }
      }
    },
    [bpm, beatsPerBar, subdivision, onBars, offBars, gapActive, scheduleNote]
  );

  useAudioScheduler(onTick, isRunning);

  // Visual loop (unchanged logic, just consumes queue)
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (!isRunning) return;
      const ctx = AudioContextManager.getContext();
      const now = ctx.currentTime;
      while (visualQueueRef.current.length > 0) {
        const nextEvent = visualQueueRef.current[0];
        if (nextEvent.time <= now) {
          const event = visualQueueRef.current.shift();
          if (event) {
            setCurrentBeat(event.beat);
            // setCurrentBar(event.bar);
            setIsGap(event.isGap);
          }
        } else {
          break;
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    if (isRunning) loop();
    return () => cancelAnimationFrame(frameId);
  }, [isRunning]);

  const start = () => {
    if (isRunning) return;
    const ctx = AudioContextManager.getContext();
    nextNoteTimeRef.current = ctx.currentTime + 0.1;
    visualQueueRef.current = [];
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
  };

  const reset = () => {
    currentBeatRef.current = 0;
    currentBarRef.current = 0;
    setCurrentBeat(0);
    // setCurrentBar(1);
    setIsGap(false);
    visualQueueRef.current = [];
  };

  // If gap is active but the config is invalid (null or < 1), stop and reset.
  useEffect(() => {
    const hasValidGapValues =
      onBars !== null && offBars !== null && onBars >= 1 && offBars >= 1;

    if (gapActive && !hasValidGapValues && isRunning) {
      // Defer state updates out of the current render flush.
      const id = window.setTimeout(() => {
        setIsRunning(false);
        currentBeatRef.current = 0;
        currentBarRef.current = 0;
        setCurrentBeat(0);
        setIsGap(false);
        visualQueueRef.current = [];
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [onBars, offBars, gapActive, isRunning]);

  const tapTempo = () => {
    const now = Date.now();
    const diff = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;

    if (diff > 2000) {
      tapBufferRef.current = [now];
      return;
    }

    tapBufferRef.current.push(now);
    if (tapBufferRef.current.length > 4) {
      tapBufferRef.current.shift();
    }

    if (tapBufferRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapBufferRef.current.length; i++) {
        intervals.push(tapBufferRef.current[i] - tapBufferRef.current[i - 1]);
      }
      const newBpm = calculateBpmFromIntervals(intervals);
      if (newBpm >= 20 && newBpm <= 240) {
        setBpm(newBpm);
      }
    }
  };

  return {
    bpm,
    setBpm,
    beatsPerBar,
    setBeatsPerBar,
    subdivision,
    setSubdivision,
    onBars,
    setOnBars,
    offBars,
    setOffBars,
    gapActive,
    setGapActive,
    isRunning,
    start,
    stop,
    reset,
    tapTempo,
    currentBeat,
    // currentBar,
    isGap,
  };
}
