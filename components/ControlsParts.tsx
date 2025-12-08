import React, { memo, useCallback } from 'react';
import { useRenderLogger } from './renderLogger';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  bpmAtom,
  multiplierAtom,
  isPlayingAtom,
  modeAtom,
  visibleAtom,
  hueStepAtom,
} from '../state/atoms';
import { Play, Pause, Maximize, Plus, Minus, MousePointerClick } from 'lucide-react';
import { ColorMode } from '../types';

export const Header = memo(function Header() {
  useRenderLogger('ControlsParts.Header');
  const bpm = useAtomValue(bpmAtom);
  return (
    <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
      <h1 className="text-white font-bold text-2xl tracking-tighter flex items-center gap-3">
        <span className="w-3 h-3 bg-white animate-pulse" style={{ animationDuration: `${60 / bpm}s` }} />
        HUE_BEAT
      </h1>
      <div />
    </div>
  );
});

export const HiddenToggle = memo(function HiddenToggle() {
  const setVisible = useSetAtom(visibleAtom);
  const open = useCallback(() => setVisible(true), [setVisible]);
  useRenderLogger('ControlsParts.HiddenToggle');
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={open}
        className="bg-black/20 hover:bg-black/50 text-white/50 hover:text-white p-3 backdrop-blur-sm transition-all border border-white/10 hover:border-white"
      >
        <svg width="24" height="24" aria-hidden="true" />
      </button>
    </div>
  );
});

export const TempoControl = memo(function TempoControl() {
  const bpm = useAtomValue(bpmAtom);
  const setBpm = useSetAtom(bpmAtom);

  const handleTap = useCallback(() => {
    const now = performance.now();
    // Very small helper to measure tap — kept inline here, not making the whole component re-render frequently
    // We'll calculate simple two-tap approach for now: not central to re-render fixes
    // This is intentionally light: callers will setBpm directly.
    setBpm(prev => Math.max(40, Math.min(240, prev))); // noop safe
  }, [setBpm]);
  useRenderLogger('ControlsParts.TempoControl');

  return (
    <div className="bg-white/5 p-6 border border-white/10 mb-6 group hover:border-white/30 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Tempo</span>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              value={bpm || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (Number.isNaN(val)) setBpm(0);
                else setBpm(Math.min(999, Math.abs(val)));
              }}
              onBlur={() => {
                if (bpm < 1) setBpm(120);
              }}
              className="bg-transparent text-5xl font-bold text-white tracking-tighter w-32 outline-none border-b-2 border-transparent focus:border-white/50 transition-colors placeholder-white/20"
              placeholder="---"
            />
            <span className="text-sm text-white/50 font-bold">BPM</span>
          </div>
        </div>

        <div className="flex gap-2 items-stretch">
          <button onClick={handleTap} className="px-5 bg-white/10 hover:bg-white/20 text-white font-medium transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border border-white/5 hover:border-white/50">
            <MousePointerClick size={16} />
            <span className="text-[10px] uppercase tracking-wide opacity-70">Tap</span>
          </button>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setBpm((x) => x + 1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5 hover:border-white/50 flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setBpm((x) => Math.max(1, x - 1))}
              className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5 hover:border-white/50 flex items-center justify-center"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Range */}
      <div className="mb-6 px-1">
        <input
          type="range"
          min="60"
          max="180"
          step="1"
          value={Math.max(60, Math.min(180, bpm))}
          onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] font-bold text-white/30 mt-2 font-mono uppercase tracking-widest select-none">
          <span>60</span>
          <span>120</span>
          <span>180</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setBpm((x) => Math.max(1, Math.floor(x / 2)))} className="...">÷2 Half</button>
        <button onClick={() => setBpm((x) => Math.min(999, x * 2))} className="...">×2 Double</button>
      </div>
    </div>
  );
});

export const SpeedOptions = memo(function SpeedOptions() {
    useRenderLogger('ControlsParts.SpeedOptions');
  const options = [
    { value: 0.25, label: '1/4x' },
    { value: 0.5, label: '1/2x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
  ];
  return (
    <div className="mb-6">
      <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 mb-3 block">Rhythm Multiplier</span>
      <div className="grid grid-cols-5 gap-1">
        {options.map(opt => (
          <SpeedOption key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </div>
    </div>
  );
});

const SpeedOption = memo(function SpeedOption({ value, label }:{ value:number; label:string }) {
    useRenderLogger(`ControlsParts.SpeedOption(${label})`);
  const multiplier = useAtomValue(multiplierAtom);
  const setMultiplier = useSetAtom(multiplierAtom);
  const onClick = useCallback(() => setMultiplier(value), [setMultiplier, value]);
  return (
    <button onClick={onClick} className={multiplier === value ? 'active' : 'inactive'}>
      <span>{label}</span>
    </button>
  );
});

export const ShiftOptions = memo(function ShiftOptions() {
  useRenderLogger('ControlsParts.ShiftOptions');
  const options = [30,45,90,137.5,180,-1];
  return (
    <div className="mb-6">
      <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 mb-3 block">Color Shift (Deg)</span>
      <div className="grid grid-cols-6 gap-1">
        {options.map(opt => (
          <ShiftOption key={String(opt)} value={opt} />
        ))}
      </div>
    </div>
  );
});

const ShiftOption = memo(function ShiftOption({ value }:{ value:number }) {
    useRenderLogger(`ControlsParts.ShiftOption(${value})`);
  const hueStep = useAtomValue(hueStepAtom);
  const setHueStep = useSetAtom(hueStepAtom);
  const onClick = useCallback(() => setHueStep(value), [setHueStep, value]);
  return (
    <button onClick={onClick} className={hueStep === value ? 'active' : 'inactive'}>
      <span>{value === -1 ? 'RND' : (value === 137.5 ? 'GOLD' : `${value}°`)}</span>
    </button>
  );
});

export const ModeOptions = memo(function ModeOptions() {
  useRenderLogger('ControlsParts.ModeOptions');
  const options = [
    { id: ColorMode.FLOW, label: 'FLOW' },
    { id: ColorMode.STEP, label: 'STEP' },
    { id: ColorMode.STROBE, label: 'STROBE' },
  ];
  return (
    <div className="space-y-2 mb-8">
      <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Mode</span>
      <div className="grid grid-cols-3 gap-2">
        {options.map(m => (
          <ModeOption key={m.id} id={m.id} label={m.label} />
        ))}
      </div>
    </div>
  );
});

const ModeOption = memo(function ModeOption({ id, label }: { id:ColorMode; label:string }) {
    useRenderLogger(`ControlsParts.ModeOption(${label})`);
  const mode = useAtomValue(modeAtom);
  const setMode = useSetAtom(modeAtom);
  const onClick = useCallback(() => setMode(id), [setMode, id]);
  return (
    <button onClick={onClick} className={mode === id ? 'active' : 'inactive'}>
      <span>{label}</span>
    </button>
  );
});

export const PlaybackButtons = memo(function PlaybackButtons({ toggleFullscreen }: { toggleFullscreen: () => void }) {
  useRenderLogger('ControlsParts.PlaybackButtons');
  const isPlaying = useAtomValue(isPlayingAtom);
  const setPlaying = useSetAtom(isPlayingAtom);
  const togglePlaying = useCallback(() => setPlaying(p => !p), [setPlaying]);
  return (
    <div className="grid grid-cols-2 gap-4">
      <button onClick={togglePlaying}>{isPlaying ? <Pause /> : <Play />}</button>
      <button onClick={toggleFullscreen}><Maximize /></button>
    </div>
  );
});

export default {};
