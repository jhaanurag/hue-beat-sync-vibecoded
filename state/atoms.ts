import { atom } from 'jotai';
import { ColorMode } from '../types';

export const bpmAtom = atom<number>(120);
export const multiplierAtom = atom<number>(1);
export const isPlayingAtom = atom<boolean>(true);
export const modeAtom = atom<ColorMode>(ColorMode.FLOW);
export const visibleAtom = atom<boolean>(true);
export const hueStepAtom = atom<number>(137.5);

// Optionally, you can derive atoms here later if needed.

export default {};
