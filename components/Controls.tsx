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
  Shuffle,
  Mic,
  Music,
  Link as LinkIcon,
  LogOut
} from 'lucide-react';
import { ColorMode, SpotifyTrack } from '../types';

interface ControlsProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  multiplier: number;
  setMultiplier: (m: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  hueStep: number;
  setHueStep: (step: number) => void;
  toggleFullscreen: () => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  spotifyTrack: SpotifyTrack | null;
  onSpotifyConnect: (clientId: string) => void;
  onSpotifyDisconnect: () => void;
  isSpotifyConnected: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  bpm,
  setBpm,
  multiplier,
  setMultiplier,
  isPlaying,
  setIsPlaying,
  mode,
  setMode,
  hueStep,
  setHueStep,
  toggleFullscreen,
  visible,
  setVisible,
  spotifyTrack,
  onSpotifyConnect,
  onSpotifyDisconnect,
  isSpotifyConnected
}) => {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [beatDetected, setBeatDetected] = useState(false);
  const [spotifyClientId, setSpotifyClientId] = useState('');

  // Audio Analysis Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastBeatTimeRef = useRef<number>(0);
  const bpmHistoryRef = useRef<number[]>([]);
  const energyHistoryRef = useRef<number[]>([]);

  // Load saved client ID
  useEffect(() => {
    const savedId = localStorage.getItem('spotify_client_id');
    if (savedId) setSpotifyClientId(savedId);
  }, []);

  // Handle BPM Tapping
  const handleTap = useCallback(() => {
    const now = performance.now();
    setTapTimes(prev => {
      const newTaps = [...prev, now].filter(t => now - t < 2000); // Keep taps within last 2 seconds
      
      if (newTaps.length > 1) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const newBpm = Math.round(60000 / avgInterval);
        if (newBpm > 30 && newBpm < 300) {
          setBpm(newBpm);
        }
      }
      return newTaps;
    });
  }, [setBpm]);

  // Handle Microphone BPM Detection
  useEffect(() => {
    let isCancelled = false;

    if (!isListening) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      audioCtxRef.current = null;
      setBeatDetected(false);
      return;
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (isCancelled) return;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        audioCtxRef.current = audioCtx;
        
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048; 
        
        const lowPass = audioCtx.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 150; 
        lowPass.Q.value = 1;
        
        source.connect(lowPass);
        lowPass.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        bpmHistoryRef.current = [];
        energyHistoryRef.current = [];
        lastBeatTimeRef.current = 0;
        
        const detect = () => {
          if (!audioCtxRef.current || isCancelled) return;
          
          analyser.getByteFrequencyData(dataArray);
          
          let bassEnergy = 0;
          const bassBins = 8;
          for(let i = 0; i < bassBins; i++) {
            bassEnergy += dataArray[i];
          }
          bassEnergy /= bassBins;

          const history = energyHistoryRef.current;
          history.push(bassEnergy);
          if (history.length > 40) history.shift(); 

          const localAverage = history.reduce((a, b) => a + b, 0) / (history.length || 1);
          
          const now = audioCtx.currentTime;
          
          if (bassEnergy > localAverage * 1.3 && bassEnergy > 50) {
             const timeSinceLastBeat = now - lastBeatTimeRef.current;

             if (timeSinceLastBeat > 0.25) { 
                 setBeatDetected(true);
                 setTimeout(() => !isCancelled && setBeatDetected(false), 100);

                 if (timeSinceLastBeat < 1.5) {
                    const instantBpm = 60 / timeSinceLastBeat;
                    bpmHistoryRef.current.push(instantBpm);
                    if (bpmHistoryRef.current.length > 8) bpmHistoryRef.current.shift();
                    
                    const sorted = [...bpmHistoryRef.current].sort((a,b) => a - b);
                    const medianBpm = sorted[Math.floor(sorted.length / 2)];
                    
                    if (bpmHistoryRef.current.length >= 4) {
                       setBpm(Math.round(medianBpm));
                    }
                 }
                 lastBeatTimeRef.current = now;
             }
          }

          rafIdRef.current = requestAnimationFrame(detect);
        };
        
        detect();

      } catch (err) {
        console.error("Microphone initialization failed:", err);
        setIsListening(false);
        alert("Could not access microphone. Please check permissions and reload.");
      }
    };

    initAudio();

    return () => {
      isCancelled = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [isListening, setBpm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Enter') {
            (document.activeElement as HTMLInputElement).blur();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      if (e.code === 'ArrowUp') setBpm(Math.min(999, bpm + 1));
      if (e.code === 'ArrowDown') setBpm(Math.max(1, bpm - 1));
      if (e.key === 'h') setVisible(!visible);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bpm, isPlaying, setIsPlaying, setBpm, visible, setVisible]);

  if (!visible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setVisible(true)}
          className="bg-black/20 hover:bg-black/50 text-white/50 hover:text-white p-3 backdrop-blur-sm transition-all border border-white/10 hover:border-white"
        >
          <Activity size={24} />
        </button>
      </div>
    );
  }

  const speedOptions = [
    { value: 0.25, label: '1/4x', sub: '4 Bars' },
    { value: 0.5, label: '1/2x', sub: '2 Bars' },
    { value: 1, label: '1x', sub: 'Beat' },
    { value: 2, label: '2x', sub: '8th' },
    { value: 4, label: '4x', sub: '16th' },
  ];

  const shiftOptions = [
    { value: 30, label: '30°' },
    { value: 45, label: '45°' },
    { value: 90, label: '90°' },
    { value: 137.5, label: 'GOLD' }, // Golden Angle
    { value: 180, label: 'OPP' },
    { value: -1, label: 'RND' }, // Random
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none font-mono">
      <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-8 shadow-2xl pointer-events-auto w-full max-w-md mx-4 animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <h1 className="text-white font-bold text-2xl tracking-tighter flex items-center gap-3">
            <span className="w-3 h-3 bg-white animate-pulse" style={{ animationDuration: `${60/bpm}s` }}></span>
            HUE_BEAT
          </h1>
          <button 
            onClick={() => setVisible(false)}
            className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10"
            title="Hide Controls (Press 'H')"
          >
            <EyeOff size={20} />
          </button>
        </div>

        {/* BPM Control */}
        <div className="bg-white/5 p-6 border border-white/10 mb-6 group hover:border-white/30 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                {spotifyTrack ? 'Spotify Sync' : 'Tempo'}
              </span>
              <div className="flex items-baseline gap-2">
                <input
                    type="number"
                    value={bpm || ''}
                    disabled={!!spotifyTrack}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val)) setBpm(0);
                        else setBpm(Math.min(999, Math.abs(val)));
                    }}
                    onBlur={() => {
                        if (bpm < 1) setBpm(120);
                    }}
                    className={`bg-transparent text-5xl font-bold tracking-tighter w-32 outline-none border-b-2 border-transparent transition-colors placeholder-white/20 ${
                      spotifyTrack ? 'text-green-400' : 'text-white focus:border-white/50'
                    }`}
                    placeholder="---"
                />
                <span className="text-sm text-white/50 font-bold">BPM</span>
              </div>
            </div>

            <div className="flex gap-2 items-stretch">
               {/* Auto Detect / Mic Button */}
               <button 
                onClick={() => setIsListening(!isListening)}
                className={`px-4 bg-white/10 hover:bg-white/20 text-white font-medium transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border border-white/5 hover:border-white/50 ${
                  isListening 
                    ? beatDetected 
                      ? 'bg-red-500 text-black border-red-500' // Flash on beat
                      : 'bg-red-500/20 text-red-200 border-red-500/50' 
                    : ''
                }`}
                title="Auto-detect BPM from microphone"
                disabled={!!spotifyTrack}
              >
                <Mic size={16} />
                <span className="text-[10px] uppercase tracking-wide opacity-70">{isListening ? 'On' : 'Auto'}</span>
              </button>

               <button 
                onClick={handleTap}
                disabled={!!spotifyTrack}
                className="px-5 bg-white/10 hover:bg-white/20 text-white font-medium transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border border-white/5 hover:border-white/50 disabled:opacity-50"
              >
                <MousePointerClick size={16} />
                <span className="text-[10px] uppercase tracking-wide opacity-70">Tap</span>
              </button>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setBpm(bpm + 1)} 
                  disabled={!!spotifyTrack}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5 hover:border-white/50 flex items-center justify-center disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
                <button 
                  onClick={() => setBpm(Math.max(1, bpm - 1))} 
                  disabled={!!spotifyTrack}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/5 hover:border-white/50 flex items-center justify-center disabled:opacity-50"
                >
                  <Minus size={14} />
                </button>
              </div>
            </div>
          </div>
          
          {/* BPM Range Slider */}
          <div className="mb-6 px-1">
            <input 
              type="range" 
              min="60" 
              max="180" 
              step="1"
              disabled={!!spotifyTrack}
              value={Math.max(60, Math.min(180, bpm))} 
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className={`w-full ${spotifyTrack ? 'opacity-30 cursor-not-allowed' : ''}`}
            />
            <div className="flex justify-between text-[10px] font-bold text-white/30 mt-2 font-mono uppercase tracking-widest select-none">
              <span>60</span>
              <span>120</span>
              <span>180</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setBpm(Math.max(1, Math.floor(bpm / 2)))}
              disabled={!!spotifyTrack}
              className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-bold border border-white/5 hover:border-white/30 uppercase tracking-wider disabled:opacity-50"
            >
              <span className="text-lg opacity-50">÷2</span> Half
            </button>
            <button 
              onClick={() => setBpm(Math.min(999, bpm * 2))}
              disabled={!!spotifyTrack}
              className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-bold border border-white/5 hover:border-white/30 uppercase tracking-wider disabled:opacity-50"
            >
              <span className="text-lg opacity-50">×2</span> Double
            </button>
          </div>
        </div>

        {/* Spotify Integration */}
        <div className="mb-6 bg-[#1DB954]/10 border border-[#1DB954]/20 p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Music size={16} className="text-[#1DB954]" />
            <span className="text-xs font-bold text-[#1DB954] uppercase tracking-widest">Spotify Sync</span>
          </div>

          {!isSpotifyConnected ? (
             <div className="flex flex-col gap-3">
               <input 
                 type="text" 
                 placeholder="Client ID (from Dashboard)"
                 value={spotifyClientId}
                 onChange={(e) => {
                   setSpotifyClientId(e.target.value);
                   localStorage.setItem('spotify_client_id', e.target.value);
                 }}
                 className="bg-black/30 border border-white/10 p-2 text-xs text-white placeholder-white/30 focus:border-[#1DB954] outline-none"
               />
               <button 
                onClick={() => onSpotifyConnect(spotifyClientId)}
                disabled={!spotifyClientId}
                className="bg-[#1DB954] text-black font-bold text-xs py-2 px-4 uppercase tracking-wider hover:bg-[#1ed760] disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 <LinkIcon size={12} /> Connect
               </button>
               <div className="text-[10px] text-white/40 leading-tight">
                 *Requires Spotify Premium. Add this URL to Redirect URIs in Developer Dashboard.
               </div>
             </div>
          ) : (
            <div className="flex flex-col gap-3">
               {spotifyTrack ? (
                 <div className="flex gap-3 items-center">
                    {spotifyTrack.image && (
                      <img src={spotifyTrack.image} className="w-10 h-10 border border-white/10" />
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-white text-xs font-bold truncate">{spotifyTrack.name}</span>
                      <span className="text-white/60 text-[10px] truncate">{spotifyTrack.artist}</span>
                    </div>
                 </div>
               ) : (
                 <span className="text-white/50 text-xs italic">Play a song on Spotify...</span>
               )}
               
               <button 
                 onClick={onSpotifyDisconnect}
                 className="self-start text-[10px] text-white/40 hover:text-red-400 flex items-center gap-1 mt-1"
               >
                 <LogOut size={10} /> Disconnect
               </button>
            </div>
          )}
        </div>

        {/* Speed / Interval Multiplier */}
        <div className="mb-6">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 mb-3 block">Rhythm Multiplier</span>
          <div className="grid grid-cols-5 gap-1">
            {speedOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMultiplier(opt.value)}
                className={`flex flex-col items-center justify-center py-3 px-1 border transition-all ${
                  multiplier === opt.value
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5 hover:border-white/30'
                }`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hue Step / Shift */}
        <div className="mb-6">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1 mb-3 block">Color Shift (Deg)</span>
          <div className="grid grid-cols-6 gap-1">
            {shiftOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHueStep(opt.value)}
                className={`flex flex-col items-center justify-center py-3 px-1 border transition-all ${
                  hueStep === opt.value
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5 hover:border-white/30'
                }`}
              >
                {opt.label === 'RND' ? <Shuffle size={12} /> : <span className="text-[10px] font-bold">{opt.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-2 mb-8">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Mode</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: ColorMode.FLOW, label: 'FLOW', icon: Waves },
              { id: ColorMode.STEP, label: 'STEP', icon: Activity },
              { id: ColorMode.STROBE, label: 'STROBE', icon: Zap },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-center justify-center gap-2 p-4 border transition-all ${
                  mode === m.id
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5 hover:border-white/30'
                }`}
              >
                <m.icon size={20} />
                <span className="text-xs font-bold tracking-wider">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center justify-center gap-3 p-5 font-bold transition-all border ${
              isPlaying 
                ? 'bg-white text-black border-white hover:bg-gray-200' 
                : 'bg-transparent text-white border-white/20 hover:border-white hover:bg-white/5'
            }`}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? 'PAUSE' : 'START'}
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center gap-3 p-5 bg-transparent hover:bg-white/5 text-white border border-white/20 hover:border-white transition-colors"
          >
            <Maximize size={20} />
            <span className="text-sm font-bold">FULLSCREEN</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Controls;