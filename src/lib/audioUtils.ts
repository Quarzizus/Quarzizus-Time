export class AudioContextManager {
  private static context: AudioContext | null = null;

  static getContext(): AudioContext {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
    }
    return this.context;
  }

  static async resume() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }
}

export function createClickBuffer(context: AudioContext, frequency: number, duration: number = 0.08): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Softer envelope: slower attack, smoother decay
    const envelope = Math.exp(-40 * t) * (1 - Math.exp(-400 * t)); 
    
    // Adding a tiny bit of harmonic content (square/triangle) for "woodier" sound, but keeping it mostly sine
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic = 0.1 * Math.sin(2 * Math.PI * (frequency * 2) * t); // Octave up
    
    data[i] = (fundamental + harmonic) * envelope;
  }

  return buffer;
}
