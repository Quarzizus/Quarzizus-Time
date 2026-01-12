import { useState } from "react";
import type { BeatType } from "./useLookaheadScheduler";

export interface PatternPreset {
  id: string;
  name: string;
  description: string;
  pattern: BeatType[];
  measure: number;
  subdivision: number;
}

const PATTERN_PRESETS: PatternPreset[] = [
  // {
  //   id: "simple-4-4",
  //   name: "Simple 4/4",
  //   description: "Compás 4/4 con acentos en primer beat",
  //   pattern: ["accent", "sub", "sub", "sub"],
  //   measure: 4,
  //   subdivision: 1,
  // },
  // {
  //   id: "simple-3-4",
  //   name: "Simple 3/4",
  //   description: "Compás 3/4 con acentos en primer beat",
  //   pattern: ["accent", "sub", "sub"],
  //   measure: 3,
  //   subdivision: 1,
  // },
  {
    id: "clave-son-2-3",
    name: "🌷 Clave de Son 2-3",
    description: "Patrón tradicional de clave de son (2-3)",
    pattern: [
      "mute",
      "mute",
      "accent",
      "mute",
      //
      "accent",
      "mute",
      "mute",
      "mute",
      //
      "accent",
      "mute",
      "mute",
      "accent",
      //
      "mute",
      "mute",
      "accent",
      "mute",
    ],
    measure: 4,
    subdivision: 4,
  },
  {
    id: "clave-son-3-2",
    name: "⚡  Clave de Son 3-2 ",
    description: "Patrón tradicional de clave de son (3-2)",
    pattern: [
      "accent",
      "mute",
      "mute",
      "accent",
      //
      "mute",
      "mute",
      "accent",
      "mute",
      //
      "mute",
      "mute",
      "accent",
      "mute",
      //
      "accent",
      "mute",
      "mute",
      "mute",
    ],
    measure: 4,
    subdivision: 4,
  },

  {
    id: "clave-rumba-2-3",
    name: "🪼 Clave de Rumba 2-3",
    description: "Patrón tradicional de clave de rumba (2-3)",
    pattern: [
      "mute",
      "mute",
      "accent",
      "mute",
      //
      "accent",
      "mute",
      "mute",
      "mute",
      //
      "accent",
      "mute",
      "mute",
      "accent",
      //
      "mute",
      "mute",
      "mute",
      "accent",
    ],
    measure: 4,
    subdivision: 4,
  },
  {
    id: "clave-rumba-3-2",
    name: "🪷 Clave de Rumba 3-2",
    description: "Patrón tradicional de clave de rumba (3-2)",
    pattern: [
      "accent",
      "mute",
      "mute",
      "accent",
      //
      "mute",
      "mute",
      "mute",
      "accent",
      //
      "mute",
      "mute",
      "accent",
      "mute",
      //
      "accent",
      "mute",
      "mute",
      "mute",
    ],
    measure: 4,
    subdivision: 4,
  },
  {
    id: "clave-bembe",
    name: "🐴 Clave de Bembé",
    description: "Patrón tradicional de clave de bembé",
    pattern: [
      "accent",
      "mute",
      "accent",
      //
      "mute",
      "accent",
      "accent",
      //
      "mute",
      "accent",
      "mute",
      //
      "accent",
      "mute",
      "accent",
    ],
    measure: 4,
    subdivision: 3,
  },
  {
    id: "clave-bossa",
    name: "🌺 Clave de Bossa",
    description: "Patrón tradicional de clave de bossa (samba)",
    pattern: [
      "mute",
      "mute",
      "accent",
      "mute",
      //
      "mute",
      "accent",
      "mute",
      "mute",
      //
      "accent",
      "mute",
      "mute",
      "accent",
      //
      "mute",
      "mute",
      "accent",
      "mute",
    ],
    measure: 4,
    subdivision: 4,
  },
];

const DEFAULT_PATTERN: BeatType[] = ["accent", "sub", "sub", "sub"];

const usePattern = () => {
  const [patternMode, setPatternMode] = useState<"simple" | "advanced">(
    "simple",
  );
  const [selectedPresetId, setSelectedPresetId] =
    useState<string>("simple-4-4");
  const [customPattern, setCustomPattern] =
    useState<BeatType[]>(DEFAULT_PATTERN);

  const selectedPreset =
    PATTERN_PRESETS.find((preset) => preset.id === selectedPresetId) ||
    PATTERN_PRESETS[0];

  const handlePatternModeChange = (mode: "simple" | "advanced") => {
    setPatternMode(mode);
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PATTERN_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCustomPattern(preset.pattern);
    }
  };

  const getCurrentPattern = () => {
    return patternMode === "simple" ? DEFAULT_PATTERN : customPattern;
  };

  const getCurrentMeasure = () => {
    return patternMode === "simple" ? 4 : selectedPreset.measure;
  };

  const getCurrentSubdivision = () => {
    return patternMode === "simple" ? 1 : selectedPreset.subdivision;
  };

  return {
    patternMode,
    selectedPresetId,
    customPattern,
    presets: PATTERN_PRESETS,
    selectedPreset,
    handlePatternModeChange,
    handlePresetChange,
    getCurrentPattern,
    getCurrentMeasure,
    getCurrentSubdivision,
  };
};

export { usePattern };
