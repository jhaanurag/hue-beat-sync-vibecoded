export enum ColorMode {
  STEP = 'STEP',   // Changes abruptly on the beat
  FLOW = 'FLOW',   // Smoothly rotates, synchronized to bars
  STROBE = 'STROBE' // Flashes between black and color
}

export interface AppState {
  bpm: number;
  multiplier: number; // Speed multiplier (e.g., 0.5x, 1x, 2x)
  isPlaying: boolean;
  mode: ColorMode;
  hue: number;
  lightness: number; // 0-100
  saturation: number; // 0-100
  showControls: boolean;
}
