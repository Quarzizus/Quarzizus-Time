import { useState, useEffect } from "react";
import { useMetronomeEngine } from "./hooks/useMetronomeEngine";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { BpmControl } from "./components/BpmControl/BpmControl";
import { Transport } from "./components/PlayerControls/Transport";
import { TapTempoButton } from "./components/PlayerControls/TapTempoButton";
import { Visualizer } from "./components/Visualizer/Visualizer";
import { TimeSignatureSelector } from "./components/TimeSignatureSelector/TimeSignatureSelector";
import { SubdivisionSelector } from "./components/SubdivisionSelector/SubdivisionSelector";
import { GapConfig } from "./components/GapConfig/GapConfig";
import { Download } from "lucide-react";

function App() {
  const engine = useMetronomeEngine();
  const { isInstallable, install } = usePWAInstall();

  const [gapError, setGapError] = useState<string | null>(null);

  const hasInvalidGapConfig =
    engine.gapActive &&
    (!engine.onBars ||
      !engine.offBars ||
      engine.onBars < 1 ||
      engine.offBars < 1);

  const handlePlay = () => {
    if (hasInvalidGapConfig) {
      setGapError(
        "Configura valores válidos en Gap Trainer antes de reproducir."
      );
      return;
    }
    engine.start();
  };

  useEffect(() => {
    if (!gapError) return;
    const id = window.setTimeout(() => setGapError(null), 2500);
    return () => window.clearTimeout(id);
  }, [gapError]);

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
          beatsPerBar={engine.beatsPerBar}
          subdivision={engine.subdivision}
          currentBeat={engine.currentBeat}
          isGap={engine.isGap}
        />

        <div className="flex flex-col gap-4">
          <BpmControl bpm={engine.bpm} setBpm={engine.setBpm} />
          <TapTempoButton onTap={engine.tapTempo} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TimeSignatureSelector
            beatsPerBar={engine.beatsPerBar}
            setBeatsPerBar={engine.setBeatsPerBar}
          />
          <SubdivisionSelector
            subdivision={engine.subdivision}
            setSubdivision={engine.setSubdivision}
          />
        </div>

        <GapConfig
          onBars={engine.onBars}
          offBars={engine.offBars}
          gapActive={engine.gapActive}
          setOnBars={engine.setOnBars}
          setOffBars={engine.setOffBars}
          setGapActive={engine.setGapActive}
        />

        <div className="sticky bottom-6 mt-2 pb-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10 rounded-full blur-xl"></div>
          <Transport
            isRunning={engine.isRunning}
            onPlay={handlePlay}
            onStop={engine.stop}
            onReset={engine.reset}
          />
        </div>

        {gapError && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs shadow-lg">
            {gapError}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
