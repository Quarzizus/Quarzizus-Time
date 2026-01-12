import { metrics } from "./metrics";

export class AudioClock {
  private static instance: AudioClock | null = null;
  private audioContext: AudioContext | null = null;
  private audioStartTime: number = 0;
  private perfStartTime: number = 0;
  private keepAliveInterval: number | null = null;
  private silentKeepAliveInterval: number | null = null;
  private driftLogInterval: number | null = null;
  private isSynchronized: boolean = false;

  private constructor() {
    // Lazy initialization
  }

  static getInstance(): AudioClock {
    if (!AudioClock.instance) {
      AudioClock.instance = new AudioClock();
    }
    return AudioClock.instance;
  }

  private ensureContext(): void {
    if (this.audioContext === null) {
      const AudioContextClass = window.AudioContext;
      this.audioContext = new AudioContextClass();
      this.startKeepAlive();
      
      // Registrar cambios de estado del AudioContext
      this.audioContext.addEventListener('statechange', () => {
        metrics.recordAudioStateChange(this.audioContext!.state);
      });
    }
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval !== null) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = window.setInterval(async () => {
      if (this.audioContext!.state === 'suspended') {
        await this.audioContext!.resume();
      }
    }, 10000);

    // Silent pulse keep-alive for browsers that suspend AudioContext despite resume calls
    if (this.silentKeepAliveInterval !== null) {
      clearInterval(this.silentKeepAliveInterval);
    }

    this.silentKeepAliveInterval = window.setInterval(() => {
      this.playSilentPulse();
    }, 15000);

    // Drift logging cada 5 segundos
    if (this.driftLogInterval !== null) {
      clearInterval(this.driftLogInterval);
    }

    this.driftLogInterval = window.setInterval(() => {
      this.logDrift();
    }, 5000);
  }

  private playSilentPulse(): void {
    this.ensureContext();
    if (this.audioContext!.state !== 'running') {
      return;
    }
    
    try {
      const oscillator = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      oscillator.frequency.value = 1; // 1 Hz, inaudible
      gain.gain.value = 0.0001; // Extremely quiet
      
      oscillator.connect(gain);
      gain.connect(this.audioContext!.destination);
      
      oscillator.start(this.audioContext!.currentTime);
      oscillator.stop(this.audioContext!.currentTime + 0.1);
    } catch {
      // Ignore errors
    }
  }

  private logDrift(): void {
    if (!this.isSynchronized) {
      return;
    }
    const audioTime = this.audioContext!.currentTime;
    const perfTime = performance.now();
    const calculatedAudioTime = this.getAudioTime(perfTime);
    const driftMs = (calculatedAudioTime - audioTime) * 1000;
    metrics.recordClockDrift(driftMs, audioTime, perfTime);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval !== null) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.silentKeepAliveInterval !== null) {
      clearInterval(this.silentKeepAliveInterval);
      this.silentKeepAliveInterval = null;
    }
    if (this.driftLogInterval !== null) {
      clearInterval(this.driftLogInterval);
      this.driftLogInterval = null;
    }
  }

  async resume(): Promise<void> {
    this.ensureContext();
    const previousState = this.audioContext!.state;
    if (previousState === 'suspended') {
      await this.audioContext!.resume();
      metrics.recordAudioStateChange(this.audioContext!.state, previousState);
      metrics.recordContextResume();
    }
  }

  suspend(): void {
    this.ensureContext();
    const previousState = this.audioContext!.state;
    if (previousState === 'running') {
      this.audioContext!.suspend();
      metrics.recordAudioStateChange(this.audioContext!.state, previousState);
      metrics.recordContextSuspend();
    }
  }

  synchronizeClocks(): void {
    this.ensureContext();
    this.audioStartTime = this.audioContext!.currentTime;
    this.perfStartTime = performance.now();
    this.isSynchronized = true;
    
    const driftMs = this.audioStartTime * 1000 - this.perfStartTime;
    metrics.recordClockDrift(driftMs, this.audioStartTime, this.perfStartTime);
  }

  getAudioTime(perfTime: number = performance.now()): number {
    if (!this.isSynchronized) {
      this.synchronizeClocks();
    }
    
    const perfDelta = perfTime - this.perfStartTime;
    return this.audioStartTime + (perfDelta / 1000);
  }

  getPerfTime(audioTime: number): number {
    if (!this.isSynchronized) {
      this.synchronizeClocks();
    }
    
    const audioDelta = audioTime - this.audioStartTime;
    return this.perfStartTime + (audioDelta * 1000);
  }

  scheduleAtAudioTime(callback: (audioTime: number) => void, audioTime: number): () => void {
    this.ensureContext();
    const nowAudio = this.audioContext!.currentTime;
    const delay = Math.max(0, audioTime - nowAudio);
    
    if (delay === 0) {
      callback(audioTime);
      return () => {}; // No-op cancel function
    } else {
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
          // Source may have already ended or been stopped
        }
      };
    }
  }

  getContext(): AudioContext {
    this.ensureContext();
    return this.audioContext!;
  }

  getCurrentAudioTime(): number {
    this.ensureContext();
    return this.audioContext!.currentTime;
  }

  isRunning(): boolean {
    this.ensureContext();
    return this.audioContext!.state === 'running';
  }

  destroy(): void {
    this.stopKeepAlive();
    if (this.audioContext !== null && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    AudioClock.instance = null;
  }
}

export const audioClock = AudioClock.getInstance();