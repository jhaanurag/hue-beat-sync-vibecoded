import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { bpmAtom, multiplierAtom, isPlayingAtom, modeAtom, hueStepAtom } from '../state/atoms';
import { ColorMode } from '../types';
import { setAnimation } from '../lib/animation';

const AnimationController: React.FC = () => {
  const bpm = useAtomValue(bpmAtom);
  const multiplier = useAtomValue(multiplierAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const mode = useAtomValue(modeAtom);
  const hueStep = useAtomValue(hueStepAtom);

  const hueRef = useRef<number>(0);
  const lightnessRef = useRef<number>(50);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current != null) {
        const deltaTime = time - lastTimeRef.current;
        if (isPlaying) {
          const beatDuration = 60000 / bpm;
          const intervalDuration = beatDuration / multiplier;

          if (mode === ColorMode.FLOW) {
            const degreesPerMs = (360 / (4 * beatDuration)) * multiplier;
            hueRef.current = (hueRef.current + deltaTime * degreesPerMs) % 360;
            lightnessRef.current = 50;
          } else if (mode === ColorMode.STEP) {
            accumulatedTimeRef.current += deltaTime;
            if (accumulatedTimeRef.current >= intervalDuration) {
              const step = hueStep === -1 ? Math.random() * 360 : hueStep;
              hueRef.current = (hueRef.current + step) % 360;
              accumulatedTimeRef.current -= intervalDuration;
            }
            lightnessRef.current = 50;
          } else if (mode === ColorMode.STROBE) {
            accumulatedTimeRef.current += deltaTime;
            const phase = accumulatedTimeRef.current % intervalDuration;
            const isFlash = phase < (intervalDuration / 2);
            lightnessRef.current = isFlash ? 50 : 0;
            if (accumulatedTimeRef.current >= intervalDuration) {
              const step = hueStep === -1 ? Math.random() * 360 : hueStep;
              hueRef.current = (hueRef.current + step) % 360;
              accumulatedTimeRef.current -= intervalDuration;
            }
          }
        }
      }
      lastTimeRef.current = time;
      setAnimation(hueRef.current, lightnessRef.current);
      const rootNode = document.getElementById('root');
      if (rootNode) {
        const bgColor = `hsl(${Math.round(hueRef.current)}, 100%, ${Math.round(lightnessRef.current)}%)`;
        (rootNode as HTMLElement).style.backgroundColor = bgColor;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [bpm, multiplier, isPlaying, mode, hueStep]);

  return null;
};

export default AnimationController;
