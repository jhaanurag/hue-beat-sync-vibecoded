import React, { useEffect, useCallback, useState } from 'react';
import Controls from './components/Controls';
import AnimationController from './components/AnimationController';
import { SmallHud } from './components/Controls';
import { useAtom } from 'jotai';
import { visibleAtom } from './state/atoms';

const App: React.FC = () => {
  // --- State (moved to jotai atoms) ---
  // Only read visible in App to prevent App from re-rendering when other atoms change
  const [visibleControls, setVisibleControls] = useAtom(visibleAtom);

  // Visual state is handled in an independent AnimationController which updates the DOM
  
  // --- Animation controller runs independently, no local refs needed here ---

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
      />
      
      {/* Minimal Overlay Instruction when controls hidden */}
      {!visibleControls && (
        <SmallHud />
      )}
    </div>
  );
};

export default App;