import React, { useState, useEffect, useRef, useCallback } from 'react';
import Controls from './components/Controls';
import { ColorMode, SpotifyTrack } from './types';

const App: React.FC = () => {
  // --- State ---
  const [bpm, setBpm] = useState<number>(120);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [mode, setMode] = useState<ColorMode>(ColorMode.FLOW);
  const [visibleControls, setVisibleControls] = useState<boolean>(true);
  const [hueStep, setHueStep] = useState<number>(137.5); // Default to Golden Angle
  
  // Spotify State
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);
  
  // Visual state
  const [hue, setHue] = useState<number>(0);
  const [lightness, setLightness] = useState<number>(50); 
  
  // --- Animation Refs ---
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const pollIntervalRef = useRef<number | null>(null);

  // --- Spotify Logic ---

  useEffect(() => {
    // 1. Check for token in URL hash (Redirect from Spotify)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const token = new URLSearchParams(hash.substring(1)).get('access_token');
      if (token) {
        setSpotifyToken(token);
        localStorage.setItem('spotify_token', token);
        window.location.hash = ''; // Clear hash
      }
    } else {
        // 2. Check LocalStorage
        const savedToken = localStorage.getItem('spotify_token');
        if (savedToken) setSpotifyToken(savedToken);
    }
  }, []);

  const handleSpotifyConnect = (clientId: string) => {
    const redirectUri = window.location.origin + window.location.pathname;
    const scopes = 'user-read-currently-playing user-read-playback-state';
    // Using Implicit Grant Flow for client-side only (Note: Deprecated but works for static prototypes without backend)
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = authUrl;
  };

  const handleSpotifyDisconnect = () => {
    setSpotifyToken(null);
    setSpotifyTrack(null);
    localStorage.removeItem('spotify_token');
    if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
    }
  };

  // Poll Spotify for Current Song
  useEffect(() => {
    if (!spotifyToken) return;

    const fetchSpotifyData = async () => {
        try {
            // Get Currently Playing
            const playerRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: { 'Authorization': `Bearer ${spotifyToken}` }
            });

            if (playerRes.status === 204) return; // No content
            if (playerRes.status === 401) {
                handleSpotifyDisconnect(); // Token expired
                return;
            }

            const playerData = await playerRes.json();
            
            if (playerData.item && playerData.item.type === 'track') {
                const trackId = playerData.item.id;
                
                // Only fetch Audio Features if it's a new track or we haven't set BPM yet
                if (!spotifyTrack || spotifyTrack.name !== playerData.item.name) {
                    const featuresRes = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
                        headers: { 'Authorization': `Bearer ${spotifyToken}` }
                    });
                    
                    if (featuresRes.ok) {
                        const features = await featuresRes.json();
                        const trackBpm = Math.round(features.tempo);
                        
                        setSpotifyTrack({
                            name: playerData.item.name,
                            artist: playerData.item.artists.map((a: any) => a.name).join(', '),
                            image: playerData.item.album.images[0]?.url,
                            bpm: trackBpm
                        });
                        
                        // AUTO SYNC BPM
                        setBpm(trackBpm);
                    }
                }
            }
        } catch (error) {
            console.error("Spotify Fetch Error", error);
        }
    };

    fetchSpotifyData(); // Initial fetch
    pollIntervalRef.current = window.setInterval(fetchSpotifyData, 3000); // Poll every 3s

    return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [spotifyToken, spotifyTrack]);


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
        spotifyTrack={spotifyTrack}
        onSpotifyConnect={handleSpotifyConnect}
        onSpotifyDisconnect={handleSpotifyDisconnect}
        isSpotifyConnected={!!spotifyToken}
      />
      
      {/* Minimal Overlay Instruction when controls hidden */}
      {!visibleControls && (
        <div className="absolute bottom-6 left-6 text-white/40 text-xs font-bold pointer-events-none select-none flex gap-6 tracking-widest">
           <span>{Math.round(hue)}°</span>
           <span>{bpm} BPM</span>
           <span>x{multiplier}</span>
           {spotifyTrack && <span className="text-green-400">{spotifyTrack.name}</span>}
        </div>
      )}
    </div>
  );
};

export default App;