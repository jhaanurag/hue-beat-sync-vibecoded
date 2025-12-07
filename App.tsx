import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      
      if (isPlaying) {
        // beatDuration = duration of one quarter note (1 beat)
        const beatDuration = 60000 / bpm; 
        
        // intervalDuration = duration based on the multiplier
        const intervalDuration = beatDuration / multiplier;

        if (mode === ColorMode.FLOW) {
          // Flow: Smooth rotation.
          // Standard rate (1x): 360 degrees over 4 beats (1 bar).
          // If multiplier increases, flow speeds up.
          const degreesPerMs = (360 / (4 * beatDuration)) * multiplier;
          setHue(h => (h + deltaTime * degreesPerMs) % 360);
          setLightness(50);
        } 
        else if (mode === ColorMode.STEP) {
          // Step: Change abruptly every interval
          accumulatedTimeRef.current += deltaTime;
          if (accumulatedTimeRef.current >= intervalDuration) {
            // Determine step size
            const step = hueStep === -1 ? Math.random() * 360 : hueStep;
            
            setHue(h => (h + step) % 360); 
            accumulatedTimeRef.current -= intervalDuration;
          }
          setLightness(50);
        }
        else if (mode === ColorMode.STROBE) {
          // Strobe: Flash ON/OFF based on interval
          accumulatedTimeRef.current += deltaTime;
          
          const phase = accumulatedTimeRef.current % intervalDuration;
          const isFlash = phase < (intervalDuration / 2); 
          
          if (isFlash) {
            setLightness(50);
          } else {
            setLightness(0); // Black
          }

          // Advance hue every interval cycle
          if (accumulatedTimeRef.current >= intervalDuration) {
            const step = hueStep === -1 ? Math.random() * 360 : hueStep;
            setHue(h => (h + step) % 360);
            accumulatedTimeRef.current -= intervalDuration;
          }
        }
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [bpm, multiplier, isPlaying, mode, hueStep]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Reset accumulation when modes change to prevent jumps
  useEffect(() => {
    accumulatedTimeRef.current = 0;
  }, [mode, bpm, multiplier, hueStep]);

  // --- Fullscreen Helper ---
  const toggleFullscreen = async () => {
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
  };

  // --- Render ---
  
  const bgStyle = {
    backgroundColor: `hsl(${hue}, 100%, ${lightness}%)`,
    transition: mode === ColorMode.FLOW ? 'none' : 'background-color 0.0s' // Instant for step/strobe
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-mono"
      style={bgStyle}
    >
      <Controls
        bpm={bpm}
        setBpm={setBpm}
        multiplier={multiplier}
        setMultiplier={setMultiplier}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        mode={mode}
        setMode={setMode}
        hueStep={hueStep}
        setHueStep={setHueStep}
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