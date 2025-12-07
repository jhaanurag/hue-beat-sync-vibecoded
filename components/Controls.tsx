import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Zap, 
  Activity, 
  Waves, 
  Maximize, 
  Minus, 
  Plus,
  EyeOff,
  MousePointerClick,
  Shuffle
} from 'lucide-react';
import { ColorMode } from '../types';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { bpmAtom, multiplierAtom, isPlayingAtom, modeAtom, visibleAtom, hueStepAtom } from '../state/atoms';
import KeyboardShortcuts from './KeyboardShortcuts';
import { animationState } from '../lib/animation';
const speedOptions = [
  { value: 0.25, label: '1/4x' },
  { value: 0.5, label: '1/2x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

const shiftOptions = [
  { value: 30, label: '30°' },
  { value: 45, label: '45°' },
  { value: 90, label: '90°' },
  { value: 137.5, label: 'GOLD' },
  { value: 180, label: 'OPP' },
  { value: -1, label: 'RND' },
];

const modeOptions = [
  { id: ColorMode.FLOW, label: 'FLOW', icon: Waves },
  { id: ColorMode.STEP, label: 'STEP', icon: Activity },
  { id: ColorMode.STROBE, label: 'STROBE', icon: Zap },
];

const TempoSection: React.FC = React.memo(() => {
  const bpm = useAtomValue(bpmAtom);
  const setBpm = useSetAtom(bpmAtom);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const handleTap = useCallback(() => {
    const now = performance.now();
    setTapTimes(prev => {
      const newTaps = [...prev, now].filter(t => now - t < 2000);
      if (newTaps.length > 1) {
        const intervals = [] as number[];
        for (let i = 1; i < newTaps.length; i++) intervals.push(newTaps[i] - newTaps[i - 1]);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const newBpm = Math.round(60000 / avgInterval);
        if (newBpm > 30 && newBpm < 300) setBpm(newBpm);
      }
      return newTaps;
    });
  }, [setBpm]);
  return (
    <div className="bg-white/5 p-6 border border-white/10 mb-6 group hover:border-white/30 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Tempo</span>
          <div className="flex items-baseline gap-2">
            <input type="number" value={bpm || ''} onChange={(e) => setBpm(Math.min(999, Math.abs(parseInt(e.target.value) || 0)))} onBlur={() => { if (bpm < 1) setBpm(120) }} className="bg-transparent text-5xl font-bold text-white tracking-tighter w-32 outline-none border-b-2 border-transparent focus:border-white/50 transition-colors placeholder-white/20" placeholder="---" />
            <span className="text-sm text-white/50 font-bold">BPM</span>
          </div>
        </div>
        <div className="flex gap-2 items-stretch">
          <button onClick={handleTap} className="px-5 bg-white/10 hover:bg-white/20 text-white font-medium transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border border-white/5 hover:border-white/50"><MousePointerClick size={16} /><span className="text-[10px] uppercase tracking-wide opacity-70">Tap</span></button>
          <div className="flex flex-col gap-2">
            <button onClick={() => setBpm(bpm + 1)} className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5 hover:border-white/50 flex items-center justify-center"><Plus size={14} /></button>
            <button onClick={() => setBpm(Math.max(1, bpm - 1))} className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5 hover:border-white/50 flex items-center justify-center"><Minus size={14} /></button>
          </div>
        </div>
      </div>
      <div className="mb-6 px-1">
        <input type="range" min="60" max="180" step="1" value={Math.max(60, Math.min(180, bpm))} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-full" />
        <div className="flex justify-between text-[10px] font-bold text-white/30 mt-2 font-mono uppercase tracking-widest select-none"><span>60</span><span>120</span><span>180</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setBpm(Math.max(1, Math.floor(bpm / 2)))} className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-bold border border-white/5 hover:border-white/30 uppercase tracking-wider"><span className="text-lg opacity-50">÷2</span> Half</button>
        <button onClick={() => setBpm(Math.min(999, bpm * 2))} className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-bold border border-white/5 hover:border-white/30 uppercase tracking-wider"><span className="text-lg opacity-50">×2</span> Double</button>
      </div>
    </div>
  );
});

const SpeedGrid: React.FC = React.memo(() => {
  const multiplier = useAtomValue(multiplierAtom);
  const setMultiplier = useSetAtom(multiplierAtom);
  return (
    <div className="mb-6">
      <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 mb-3 block">Rhythm Multiplier</span>
      <div className="grid grid-cols-5 gap-1">
        {speedOptions.map(opt => (
          <button key={opt.value} onClick={() => setMultiplier(opt.value)} className={`flex flex-col items-center justify-center py-3 px-1 border transition-all ${multiplier === opt.value ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5 hover:border-white/30'}`}>
            <span className="text-xs font-bold">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

const ShiftGrid: React.FC = React.memo(() => {
  const hueStep = useAtomValue(hueStepAtom);
  const setHueStep = useSetAtom(hueStepAtom);
  return (
    <div className="mb-6">
      <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 mb-3 block">Color Shift (Deg)</span>
      <div className="grid grid-cols-6 gap-1">
        {shiftOptions.map(opt => (
          <button key={opt.value} onClick={() => setHueStep(opt.value)} className={`flex flex-col items-center justify-center py-3 px-1 border transition-all ${hueStep === opt.value ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5 hover:border-white/30'}`}>
            {opt.label === 'RND' ? <Shuffle size={12} /> : <span className="text-[10px] font-bold">{opt.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
});

const ModesGrid: React.FC = React.memo(() => {
  const mode = useAtomValue(modeAtom);
  const setMode = useSetAtom(modeAtom);
  return (
    <div className="space-y-2 mb-8">
      <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Mode</span>
      <div className="grid grid-cols-3 gap-2">
        {modeOptions.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`flex flex-col items-center justify-center gap-2 p-4 border transition-all ${mode === m.id ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5 hover:border-white/30'}`}>
            <m.icon size={20} />
            <span className="text-xs font-bold tracking-wider">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

const PlaybackControls: React.FC<{ toggleFullscreen: () => void }> = React.memo(({ toggleFullscreen }) => {
  const isPlaying = useAtomValue(isPlayingAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  return (
    <div className="grid grid-cols-2 gap-4">
      <button onClick={() => setIsPlaying(!isPlaying)} className={`flex items-center justify-center gap-3 p-5 font-bold transition-all border ${isPlaying ? 'bg-white text-black border-white hover:bg-gray-200' : 'bg-transparent text-white border-white/20 hover:border-white hover:bg-white/5'}`}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}{isPlaying ? 'PAUSE' : 'START'}
      </button>
      <button onClick={toggleFullscreen} className="flex items-center justify-center gap-3 p-5 bg-transparent hover:bg-white/5 text-white border border-white/20 hover:border-white transition-colors"><Maximize size={20} /><span className="text-sm font-bold">FULLSCREEN</span></button>
    </div>
  );
});

export const SmallHud: React.FC = React.memo(() => {
  // We'll avoid state updates for hue — the DOM will be updated directly from animationState
  const hueEl = useRef<HTMLSpanElement | null>(null);
  const bpm = useAtomValue(bpmAtom);
  const multiplier = useAtomValue(multiplierAtom);
  const hueStep = useAtomValue(hueStepAtom);
  useEffect(() => {
    let rafId = 0;
    const update = () => {
      if (hueEl.current) {
        hueEl.current.textContent = Math.round(animationState.hue) + '°';
      }
      rafId = requestAnimationFrame(() => setTimeout(update, 300));
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return (
    <div className="absolute bottom-6 left-6 text-white/40 text-xs font-bold pointer-events-none select-none flex gap-6 tracking-widest">
      <span ref={hueEl}>{Math.round(animationState.hue)}°</span>
      <span>{bpm} BPM</span>
      <span>x{multiplier}</span>
      <span>{hueStep === -1 ? 'RND' : hueStep + '°'}</span>
    </div>
  );
});

const Header: React.FC = React.memo(() => {
  const bpm = useAtomValue(bpmAtom);
  const setVisible = useSetAtom(visibleAtom);
  return (
    <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
      <h1 className="text-white font-bold text-2xl tracking-tighter flex items-center gap-3">
        <span className="w-3 h-3 bg-white animate-pulse" style={{ animationDuration: `${60/bpm}s` }}></span>
        HUE_BEAT
      </h1>
      <button onClick={() => setVisible(false)} className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10" title="Hide Controls (Press 'H')">
        <EyeOff size={20} />
      </button>
    </div>
  );
});

const Controls: React.FC<{ toggleFullscreen: () => void }> = ({ toggleFullscreen }) => {
  const [visible, setVisible] = useAtom(visibleAtom);
  const showControls = useCallback(() => setVisible(true), [setVisible]);

  // Keyboard shortcuts handled in a separate component to avoid Controls re-renders

  if (!visible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={showControls}
          className="bg-black/20 hover:bg-black/50 text-white/50 hover:text-white p-3 backdrop-blur-sm transition-all border border-white/10 hover:border-white"
        >
          <Activity size={24} />
        </button>
      </div>
    );
  }

  // speedOptions/shiftOptions are defined at module-level to avoid re-creating arrays on each render

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none font-mono">
      <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-8 shadow-2xl pointer-events-auto w-full max-w-md mx-4 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <Header />
        <KeyboardShortcuts />

        {/* BPM Control */}
        <TempoSection />

        <SpeedGrid />

        {/* Hue Step / Shift */}
        <ShiftGrid />

        {/* Mode Selection */}
        <ModesGrid />

        {/* Playback Controls */}
        <PlaybackControls toggleFullscreen={toggleFullscreen} />

      </div>
    </div>
  );
};

export default Controls;