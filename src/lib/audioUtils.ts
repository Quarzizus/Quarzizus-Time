export class AudioContextManager {
  private static context: AudioContext | null = null;

  static getContext(): AudioContext {
    if (!this.context) {
      const AudioContextClass = window.AudioContext;
      this.context = new AudioContextClass();
    }
    return this.context;
  }

  static async resume() {
    if (this.context && this.context.state === "suspended") {
      await this.context.resume();
    }
  }
}

export function createClickBuffer(
  context: AudioContext,
  frequency: number,
  duration: number = 0.08,
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Parámetros para simular madera (Woodblock)
  // La inharmonicidad rompe la "pureza" digital y cansa menos al oído.
  const harmonicRatio = 1.47; // Ratio inarmónico típico de instrumentos de percusión/madera
  const pitchDecayRate = 20; // Qué tan rápido cae el tono (el "golpe")

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;

    // 1. Envolvente (Envelope)
    // Usamos un decaimiento exponencial puro para percusión.
    // El ataque es instantáneo (t=0), por lo que solo necesitamos controlar la cola.
    // Si quieres evitar el 'click' digital al inicio exacto, un ataque de 0.001s es útil,
    // pero aquí priorizamos la precisión del tiempo.
    const envelope = Math.exp(-t * (5.0 / duration)); // Se ajusta para que el silencio llegue al final de la duración

    // 2. Pitch Sweep (Golpe)
    // El tono baja ligeramente justo al inicio, simulando la membrana o madera siendo golpeada.
    const pitchMod = Math.exp(-pitchDecayRate * t);
    const currentFreq = frequency * (1 + 0.1 * pitchMod); // Modulación sutil del 10%

    // 3. Síntesis
    // Fundamental (Cuerpo)
    const fundamental = Math.sin(2 * Math.PI * currentFreq * t);

    // Armónico Inarmónico (El carácter "Woody")
    // Bajamos su volumen (0.75) para que coloree sin dominar.
    const inharmonic =
      0.75 * Math.sin(2 * Math.PI * (currentFreq * harmonicRatio) * t);

    // Mezcla final
    data[i] = (fundamental + inharmonic) * envelope;
  }

  return buffer;
}
