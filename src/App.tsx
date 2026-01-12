import { BpmControl } from "./components/BpmControl/BpmControl";
import { MeasureSelector } from "./components/MeasureSelector/MeasureSelector";
import { TapTempoButton } from "./components/PlayerControls/TapTempoButton";
import { SubdivisionSelector } from "./components/SubdivisionSelector/SubdivisionSelector";
import { Visualizer } from "./components/Visualizer/Visualizer";
import { useBpm } from "./hooks/useBpm";
import { useTapTempo } from "./hooks/useTapTempo";
import { useMesure } from "./hooks/useMeasure";
import { useSubdivision } from "./hooks/useSubdivision";
import { useEngine } from "./hooks/useEngine";
import { Transport } from "./components/PlayerControls/Transport";
import { GapConfig } from "./components/GapConfig/GapConfig";
import { useGap } from "./hooks/useGap";
import { PatternSelector } from "./components/PatternSelector/PatternSelector";
import { usePattern } from "./hooks/usePattern";
import { Download } from "lucide-react";
import { usePWAInstall } from "./hooksOld/usePWAInstall";
import { MetricsPanel } from "./components/MetricsPanel/MetricsPanel";
import { Notification } from "./components/Notification/Notification";

function App() {
  const { install, isInstallable } = usePWAInstall();
  const { bpm, handleBpmChange } = useBpm();
  const { tapTempo } = useTapTempo(handleBpmChange);
  const patternConfig = usePattern();

  const measureConfig = useMesure(
    patternConfig.patternMode === "simple"
      ? undefined
      : patternConfig.getCurrentMeasure(),
  );
  const subdivisionConfig = useSubdivision(
    patternConfig.patternMode === "simple"
      ? undefined
      : patternConfig.getCurrentSubdivision(),
  );
  const gapConfig = useGap();

  const engine = useEngine({
    bpm,
    measure:
      patternConfig.patternMode === "simple"
        ? measureConfig.measure
        : patternConfig.getCurrentMeasure(),
    subdivision:
      patternConfig.patternMode === "simple"
        ? subdivisionConfig.subdivision
        : patternConfig.getCurrentSubdivision(),
    gapEnabled: gapConfig.gapEnabled,
    measuresOff: gapConfig.measuresOff,
    measuresOn: gapConfig.measuresOn,
    patternMode: patternConfig.patternMode,
    pattern: patternConfig.getCurrentPattern(),
  });

  return (
    <div className="min-h-screen flex flex-col items-center py-12 bg-background text-foreground transition-colors duration-300">
      <main className="max-w-md w-full flex flex-col gap-6 px-4">
        <header className="text-center mb-2 relative">
          <h1 className="text-3xl font-bold tracking-tighter">
            Quarzizus Time
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Metrónomo profesional
          </p>
          <p className="text-muted-foreground text-xs font-medium">V.1.0.0</p>
          {isInstallable && (
            <button
              onClick={install}
              className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary transition-colors"
              title="Install App"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </header>

        <Visualizer
          measure={
            patternConfig.patternMode === "simple"
              ? measureConfig.measure
              : patternConfig.getCurrentMeasure()
          }
          subdivision={
            patternConfig.patternMode === "simple"
              ? subdivisionConfig.subdivision
              : patternConfig.getCurrentSubdivision()
          }
          currentBeat={engine.currentBeat}
          isGap={engine.isGap}
        />

        <div className="flex flex-col gap-4">
          <BpmControl bpm={bpm} handler={handleBpmChange} />
          <TapTempoButton onTap={tapTempo} />
        </div>

        <PatternSelector
          patternMode={patternConfig.patternMode}
          selectedPresetId={patternConfig.selectedPresetId}
          presets={patternConfig.presets}
          onPatternModeChange={patternConfig.handlePatternModeChange}
          onPresetChange={patternConfig.handlePresetChange}
        />

        {patternConfig.patternMode === "simple" && (
          <div className="grid grid-cols-2 gap-4">
            <MeasureSelector {...measureConfig} />
            <SubdivisionSelector {...subdivisionConfig} />
          </div>
        )}

        <GapConfig {...gapConfig} />

        <div className="sticky bottom-6 mt-2 pb-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10 rounded-full blur-xl"></div>
          <Transport {...engine} />
        </div>
      </main>
      <MetricsPanel />

      {/* Notification for configuration changes */}
      {engine.showNotification && engine.notificationMessage && (
        <Notification
          message={engine.notificationMessage}
          duration={2000}
          onClose={engine.clearNotification}
        />
      )}
    </div>
  );
}

export default App;
