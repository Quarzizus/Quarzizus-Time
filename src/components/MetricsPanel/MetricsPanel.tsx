import { useMetrics } from '../../hooks/useMetrics';
import { Download, Trash2, Activity, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function MetricsPanel() {
  const { enabled, toggleEnabled, exportJSON, exportCSV, clear, eventCount } = useMetrics();
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        title="Open metrics panel"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-card border rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Diagnóstico</h3>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{eventCount}</span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Recolección activa</span>
          <button
            onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          {enabled
            ? 'Registrando métricas de timing y estado del audio.'
            : 'Las métricas están desactivadas. Activa para diagnosticar problemas de precisión.'}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={exportJSON}
            disabled={eventCount === 0}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar JSON ({eventCount} eventos)
          </button>

          <button
            onClick={exportCSV}
            disabled={eventCount === 0}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={clear}
            disabled={eventCount === 0}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar métricas
          </button>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Las métricas ayudan a diagnosticar problemas de precisión en móviles.</p>
          <p className="mt-1">Incluyen: errores de timing, estado del audio, drift de reloj.</p>
        </div>
      </div>
    </div>
  );
}