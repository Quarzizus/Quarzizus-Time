export function secondsPerBeat(bpm: number): number {
  if (bpm <= 0) return 0;
  return 60.0 / bpm;
}

export function calculateBpmFromIntervals(intervals: number[]): number {
  if (intervals.length === 0) return 0;
  const sum = intervals.reduce((a, b) => a + b, 0);
  const avg = sum / intervals.length;
  if (avg <= 0) return 0;
  return Math.round(60000 / avg); // Intervals in ms
}

