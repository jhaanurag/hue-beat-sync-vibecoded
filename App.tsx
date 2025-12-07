import React, { useEffect, useCallback, useState } from 'react';
import Controls from './components/Controls';
import { ColorMode } from './types';

const App: React.FC = () => {
  // --- State ---
  const [bpm, setBpm] = useState<number>(120);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [mode, setMode] = useState<ColorMode>(ColorMode.FLOW);
  const [visibleControls, setVisibleControls] = useState<boolean>(true);
  const [hueStep, setHueStep] = useState<number>(137.5); // Default to Golden Angle
  
  // Visual state
  const [hue, setHue] = useState<number>(0);
  const [lightness, setLightness] = useState<number>(50); 
  
  // --- Animation Refs ---
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // --- Logic ---

  // We offload the animation loop to AnimationController so App doesn't re-render on every animation atom change

  // No animation loop here — handled in AnimationController

  // Reset accumulation when visible changes (optional) — animation controller cares about its own atoms

  // `SmallHud` runs its own (throttled) DOM update loop for hue — remove App-level display state to avoid rerenders

  // --- Fullscreen Helper ---
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  }, []);

  // --- Render ---
  
  // Note: background color is set directly via animation loop to avoid re-renders

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-mono"
    >
      <AnimationController />
      <Controls
        toggleFullscreen={toggleFullscreen}
        visible={visibleControls}
        setVisible={setVisibleControls}
      />
      
      {/* Minimal Overlay Instruction when controls hidden */}
      {!visibleControls && (
        <div className="absolute bottom-6 left-6 text-white/40 text-xs font-bold pointer-events-none select-none flex gap-6 tracking-widest">
           <span>{Math.round(hue)}°</span>
           <span>{bpm} BPM</span>
           <span>x{multiplier}</span>
           <span>{hueStep === -1 ? 'RND' : hueStep + '°'}</span>
        </div>
      )}
    </div>
  );
};

export default App;