import React, { useEffect, useRef } from 'react';
import { useSetAtom, useStore } from 'jotai';
import { bpmAtom, isPlayingAtom, visibleAtom } from '../state/atoms';

const KeyboardShortcuts: React.FC = () => {
  const store = useStore();
  const setBpm = useSetAtom(bpmAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setVisible = useSetAtom(visibleAtom);
  const bpmRef = useRef(store.get(bpmAtom));
  const isPlayingRef = useRef(store.get(isPlayingAtom));
  const visibleRef = useRef(store.get(visibleAtom));
  useEffect(() => {
    const unsubscribeBpm = store.sub(bpmAtom, () => {
      bpmRef.current = store.get(bpmAtom);
    });
    const unsubscribeIsPlaying = store.sub(isPlayingAtom, () => {
      isPlayingRef.current = store.get(isPlayingAtom);
    });
    const unsubscribeVisible = store.sub(visibleAtom, () => {
      visibleRef.current = store.get(visibleAtom);
    });
    return () => {
      unsubscribeBpm();
      unsubscribeIsPlaying();
      unsubscribeVisible();
    };
  }, [store]);

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
