import { metrics } from "./metrics";

const KEEP_ALIVE_INTERVAL = 5000;
const SILENT_PULSE_INTERVAL = 8000;
const DRIFT_LOG_INTERVAL = 5000;
const SILENT_PULSE_DURATION = 0.1;

class AudioClock {
  private static instance: AudioClock | null = null;
  private audioContext: AudioContext | null = null;
  private audioStartTime = 0;
  private perfStartTime = 0;
  private keepAliveInterval: number | null = null;
  private silentKeepAliveInterval: number | null = null;
  private driftLogInterval: number | null = null;
  private isSynchronized = false;

  private constructor() {}

  static getInstance(): AudioClock {
    if (!AudioClock.instance) {
      AudioClock.instance = new AudioClock();
    }
    return AudioClock.instance;
  }

  private ensureContext() {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.setupKeepAlive();
    this.audioContext.addEventListener("statechange", () => {
      metrics.recordAudioStateChange(this.audioContext!.state);
    });
  }

  isContextCreated() {
    return this.audioContext !== null;
  }

  private setupKeepAlive() {
    this.clearIntervals();

    this.keepAliveInterval = window.setInterval(async () => {
      if (this.audioContext!.state === "suspended") {
        await this.audioContext!.resume();
      }
    }, KEEP_ALIVE_INTERVAL);

    this.silentKeepAliveInterval = window.setInterval(
      () => this.playSilentPulse(),
      SILENT_PULSE_INTERVAL
    );

    this.driftLogInterval = window.setInterval(
      () => this.logDrift(),
      DRIFT_LOG_INTERVAL
    );
  }

  private playSilentPulse() {
    this.ensureContext();
    if (this.audioContext!.state !== "running") return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      oscillator.frequency.value = 1;
      gain.gain.value = 0.0001;

      oscillator.connect(gain);
      gain.connect(this.audioContext!.destination);

      const now = this.audioContext!.currentTime;
      oscillator.start(now);
      oscillator.stop(now + SILENT_PULSE_DURATION);
    } catch {
      // Ignore errors
    }
  }

  private logDrift() {
    if (!this.isSynchronized) return;

    const audioTime = this.audioContext!.currentTime;
    const perfTime = performance.now();
    const calculatedAudioTime = this.getAudioTime(perfTime);
    const driftMs = (calculatedAudioTime - audioTime) * 1000;

    metrics.recordClockDrift(driftMs, audioTime, perfTime);
  }

  private clearIntervals() {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    if (this.silentKeepAliveInterval) clearInterval(this.silentKeepAliveInterval);
    if (this.driftLogInterval) clearInterval(this.driftLogInterval);
  }

  async resume() {
    this.ensureContext();
    const previousState = this.audioContext!.state;

    if (previousState === "suspended" || previousState === "interrupted") {
      await this.audioContext!.resume();
      metrics.recordAudioStateChange(this.audioContext!.state, previousState);
      metrics.recordContextResume();
    }
  }

  suspend() {
    this.ensureContext();
    const previousState = this.audioContext!.state;

    if (previousState === "running") {
      this.audioContext!.suspend();
      metrics.recordAudioStateChange(this.audioContext!.state, previousState);
      metrics.recordContextSuspend();
    }
  }

  synchronizeClocks() {
    this.ensureContext();
    this.audioStartTime = this.audioContext!.currentTime;
    this.perfStartTime = performance.now();
    this.isSynchronized = true;

    const driftMs = this.audioStartTime * 1000 - this.perfStartTime;
    metrics.recordClockDrift(driftMs, this.audioStartTime, this.perfStartTime);
  }

  getAudioTime(perfTime = performance.now()) {
    if (!this.isSynchronized) {
      this.synchronizeClocks();
    }

    const perfDelta = perfTime - this.perfStartTime;
    return this.audioStartTime + perfDelta / 1000;
  }

  getPerfTime(audioTime: number) {
    if (!this.isSynchronized) {
      this.synchronizeClocks();
    }

    const audioDelta = audioTime - this.audioStartTime;
    return this.perfStartTime + audioDelta * 1000;
  }

  scheduleAtAudioTime(callback: (audioTime: number) => void, audioTime: number) {
    this.ensureContext();
    const nowAudio = this.audioContext!.currentTime;
    const delay = Math.max(0, audioTime - nowAudio);

    if (delay === 0) {
      callback(audioTime);
      return () => {};
    }

    const source = this.audioContext!.createBufferSource();
    source.buffer = this.audioContext!.createBuffer(1, 1, this.audioContext!.sampleRate);
    source.connect(this.audioContext!.destination);
    source.start(audioTime);
    source.stop(audioTime + 0.001);

    let cancelled = false;
    source.onended = () => {
      if (!cancelled) {
        callback(audioTime);
      }
    };

    return () => {
      cancelled = true;
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Ignore if already stopped
      }
    };
  }

  getContext() {
    this.ensureContext();
    return this.audioContext!;
  }

  getCurrentAudioTime() {
    this.ensureContext();
    return this.audioContext!.currentTime;
  }

  isRunning() {
    this.ensureContext();
    return this.audioContext!.state === "running";
  }

  destroy() {
    this.clearIntervals();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
    AudioClock.instance = null;
  }
}

export const audioClock = AudioClock.getInstance();