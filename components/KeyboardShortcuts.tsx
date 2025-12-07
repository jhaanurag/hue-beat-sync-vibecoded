import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { bpmAtom, isPlayingAtom, visibleAtom } from '../state/atoms';

const KeyboardShortcuts: React.FC = () => {
  const bpm = useAtomValue(bpmAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const setBpm = useSetAtom(bpmAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const visible = useAtomValue(visibleAtom);
  const setVisible = useSetAtom(visibleAtom);

  const bpmRef = useRef(bpm);
  const isPlayingRef = useRef(isPlaying);
  const visibleRef = useRef(visible);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { visibleRef.current = visible; }, [visible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Enter') (document.activeElement as HTMLInputElement).blur();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlayingRef.current);
      }
      if (e.code === 'ArrowUp') setBpm(Math.min(999, bpmRef.current + 1));
      if (e.code === 'ArrowDown') setBpm(Math.max(1, bpmRef.current - 1));
      if (e.key === 'h') setVisible(!visibleRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPlaying, setBpm, setVisible]);

  return null;
};

export default KeyboardShortcuts;
