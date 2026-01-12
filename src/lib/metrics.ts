export type MetricType = 
  | 'tick_error'
  | 'audio_state_change'
  | 'clock_drift'
  | 'audio_latency'
  | 'worker_start'
  | 'worker_stop'
  | 'context_resume'
  | 'context_suspend';

export interface MetricEvent {
  type: MetricType;
  timestamp: number; // performance.now()
  data: Record<string, unknown>;
}

export class MetricsCollector {
  private static instance: MetricsCollector | null = null;
  private events: MetricEvent[] = [];
  private maxEvents: number = 2000;
  private enabled: boolean = false; // Desactivado por defecto para producción

  private constructor() {
    // Habilitar automáticamente en desarrollo
    if (import.meta.env?.MODE === 'development') {
      this.enabled = true;
    }
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  record(type: MetricType, data: Record<string, unknown> = {}): void {
    if (!this.enabled) return;

    const event: MetricEvent = {
      type,
      timestamp: performance.now(),
      data,
    };

    this.events.push(event);
    
    // Mantener tamaño máximo
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  recordTickError(errorMs: number, targetTime: number, actualTime: number, interval: number): void {
    this.record('tick_error', {
      errorMs,
      targetTime,
      actualTime,
      interval,
      errorPercent: Math.abs(errorMs / interval) * 100,
    });
  }

  recordAudioStateChange(state: string, previousState?: string): void {
    this.record('audio_state_change', {
      state,
      previousState,
    });
  }

  recordClockDrift(driftMs: number, audioTime: number, perfTime: number): void {
    this.record('clock_drift', {
      driftMs,
      audioTime,
      perfTime,
    });
  }

  recordAudioLatency(latencyMs: number, scheduledTime: number, playedTime: number): void {
    this.record('audio_latency', {
      latencyMs,
      scheduledTime,
      playedTime,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordWorkerStart(config: any): void {
    this.record('worker_start', { config });
  }

  recordWorkerStop(): void {
    this.record('worker_stop', {});
  }

  recordContextResume(): void {
    this.record('context_resume', {});
  }

  recordContextSuspend(): void {
    this.record('context_suspend', {});
  }

  clear(): void {
    this.events = [];
  }

  getEvents(): MetricEvent[] {
    return [...this.events];
  }

  getEventsByType(type: MetricType): MetricEvent[] {
    return this.events.filter(event => event.type === type);
  }

  exportAsJSON(): string {
    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        eventCount: this.events.length,
        enabled: this.enabled,
      },
      events: this.events,
    };
    return JSON.stringify(exportData, null, 2);
  }

  exportAsCSV(): string {
    if (this.events.length === 0) {
      return '';
    }

    const headers = ['type', 'timestamp', ...Object.keys(this.events[0].data)];
    
    const rows = this.events.map(event => {
      const values: string[] = [event.type, String(event.timestamp)];
      headers.slice(2).forEach(key => {
        const value = event.data[key];
        values.push(String(value != null ? value : ''));
      });
      return values.map(v => `"${v.replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  download(filename: string = `metronome-metrics-${Date.now()}.json`): void {
    const data = this.exportAsJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  downloadCSV(filename: string = `metronome-metrics-${Date.now()}.csv`): void {
    const data = this.exportAsCSV();
    if (!data) return;
    
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
}

export const metrics = MetricsCollector.getInstance();