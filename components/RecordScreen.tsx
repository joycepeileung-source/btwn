
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedRecording } from '../types';

interface RecordScreenProps {
  onCancel: () => void;
}

type RecordPhase = 'IDLE' | 'RECORDING' | 'REVIEW';

const RecordScreen: React.FC<RecordScreenProps> = ({ onCancel }) => {
  const [phase, setPhase] = useState<RecordPhase>('IDLE');
  const [seconds, setSeconds] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  
  // Modal States
  const [recordingName, setRecordingName] = useState('');
  const [caption, setCaption] = useState('');
  const [tagLocation, setTagLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    if (phase === 'RECORDING') {
      timer = window.setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        setPhase('REVIEW');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setPhase('RECORDING');
      setSeconds(0);
      setRecordedUrl(null);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required to capture your sound journal entry.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && phase === 'RECORDING') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleToggleRecording = () => {
    if (phase === 'IDLE') {
      startRecording();
    } else if (phase === 'RECORDING') {
      stopRecording();
    } else if (phase === 'REVIEW') {
      handleDiscard();
    }
  };

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recordedUrl) return;

    if (!playbackRef.current) {
      playbackRef.current = new Audio(recordedUrl);
      playbackRef.current.onended = () => {
        setIsPlayingBack(false);
      };
    }

    if (isPlayingBack) {
      playbackRef.current.pause();
      setIsPlayingBack(false);
    } else {
      playbackRef.current.play();
      setIsPlayingBack(true);
    }
  };

  const handleDiscard = () => {
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current = null;
    }
    setRecordedUrl(null);
    setPhase('IDLE');
    setSeconds(0);
    setIsPlayingBack(false);
  };

  const handleConfirm = () => {
    const now = new Date();
    const defaultName = `Journal ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    setRecordingName(defaultName);
    setShowEditModal(true);
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use OpenStreetMap Nominatim for browser-safe geocoding (Online but No Key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'B-T-W-N-Sound-Journal-App'
              }
            }
          );
          
          if (!response.ok) throw new Error('Geocoding service unavailable');
          
          const data = await response.json();
          const addr = data.address;
          
          // Build Street, City, Country format
          const street = addr.road || addr.pedestrian || addr.suburb || '';
          const city = addr.city || addr.town || addr.village || addr.municipality || '';
          const country = addr.country || '';
          
          const formattedAddress = [street, city, country].filter(Boolean).join(', ');
          
          setTagLocation(formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (error) {
          // Fallback to raw coordinates if offline or service fails
          console.warn("Reverse geocoding failed (likely offline). Falling back to raw coords:", error);
          setTagLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        alert("Unable to reach GPS satellites. Please input your location manually.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0')
    };
  };

  const time = formatTime(seconds);

  const getHeaderMessage = () => {
    if (phase === 'RECORDING') return 'Capturing Sound';
    if (phase === 'REVIEW') return 'Review Journal';
    return 'New Journal';
  };

  const handleSave = () => {
    const now = new Date();
    const newEntry: SavedRecording = {
      id: crypto.randomUUID(),
      name: recordingName || 'Untitled Entry',
      caption: caption || 'No description provided.',
      location: tagLocation || 'Unmarked Location',
      timestamp: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      year: now.getFullYear().toString(),
      duration: seconds,
      audioUrl: recordedUrl || undefined
    };

    const existing = JSON.parse(localStorage.getItem('aether_recordings') || '[]');
    localStorage.setItem('aether_recordings', JSON.stringify([newEntry, ...existing]));
    
    onCancel();
  };

  const showReviewActions = phase === 'REVIEW' && !isPlayingBack;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full w-full flex-col overflow-hidden max-w-[480px] mx-auto z-10"
    >
      <header className="absolute top-0 left-0 w-full flex items-center p-6 pt-10 justify-between shrink-0 z-30 bg-transparent border-none shadow-none pointer-events-none">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-white/20 border border-white/40 backdrop-blur-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-warm-charcoal/60 text-2xl">close</span>
        </motion.button>
        <h2 className="text-warm-charcoal/40 text-[11px] font-medium leading-tight tracking-[0.5em] flex-1 text-center px-6 uppercase pointer-events-none">
          {getHeaderMessage()}
        </h2>
        <div className="size-12"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start relative px-10 overflow-hidden pt-28 sm:pt-36">
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
          <motion.div 
            animate={(phase === 'RECORDING' || isPlayingBack) ? {
              scale: [0.95, 1.1, 0.9, 0.95],
              rotate: [0, 90, 180, 360],
              borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "58% 42% 35% 65% / 51% 54% 46% 49%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
            } : { scale: 0.8, rotate: 0, borderRadius: "50%" }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className={`absolute w-full h-full waveform-blob transition-all duration-1000 ${(phase === 'RECORDING' || isPlayingBack) ? 'opacity-30' : 'opacity-10'}`} 
          />
          <motion.div 
            animate={(phase === 'RECORDING' || isPlayingBack) ? {
              scale: [1, 0.8, 1.05, 1],
              rotate: [360, 270, 90, 0],
              borderRadius: ["58% 42% 35% 65% / 51% 54% 46% 49%", "42% 58% 70% 30% / 45% 45% 55% 55%", "58% 42% 35% 65% / 51% 54% 46% 49%"]
            } : { scale: 0.85, rotate: 0, borderRadius: "50%" }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className={`absolute w-4/5 h-4/5 waveform-inner transition-all duration-1000 ${(phase === 'RECORDING' || isPlayingBack) ? 'opacity-50' : 'opacity-15'}`} 
          />
          
          <div className="relative z-20 flex items-center justify-center w-full">
            <AnimatePresence>
              {showReviewActions && (
                <motion.button
                  initial={{ opacity: 0, x: 20, scale: 0.5 }}
                  animate={{ opacity: 1, x: -100, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.5 }}
                  onClick={handleDiscard}
                  className="absolute z-30 size-14 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg flex items-center justify-center ceramic-button group hover:bg-white transition-colors"
                >
                  <span className="material-symbols-outlined text-warm-charcoal/40 group-hover:text-terracotta transition-colors text-2xl">close</span>
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button 
              layout
              onClick={phase === 'REVIEW' ? togglePlayback : undefined}
              className={`relative z-20 size-36 sm:size-44 rounded-full flex flex-col items-center justify-center transition-all duration-700 ${phase === 'REVIEW' ? 'bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl cursor-pointer hover:bg-white/50' : 'cursor-default'}`}
            >
              <AnimatePresence mode="wait">
                {phase === 'REVIEW' ? (
                  <motion.div 
                    key="playback-ui"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-warm-charcoal text-5xl">
                      {isPlayingBack ? 'pause' : 'play_arrow'}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="recording-ui"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    <motion.span 
                      animate={phase === 'RECORDING' ? { 
                        color: ['#5C544E', '#C67D63', '#5C544E'],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className={`material-symbols-outlined text-4xl transition-colors duration-500 ${phase === 'RECORDING' ? 'text-terracotta' : 'text-warm-charcoal/20'}`}
                    >
                      mic
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {showReviewActions && (
                <motion.button
                  initial={{ opacity: 0, x: -20, scale: 0.5 }}
                  animate={{ opacity: 1, x: 100, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.5 }}
                  onClick={handleConfirm}
                  className="absolute z-30 size-14 rounded-full bg-soft-copper shadow-xl shadow-soft-copper/20 flex items-center justify-center active:scale-95 transition-all group"
                >
                  <span className="material-symbols-outlined text-white text-3xl font-medium transition-all group-hover:scale-110">
                    done
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-6 py-6 w-full justify-center items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-20 items-center justify-center rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-sm">
              <p className={`text-2xl font-light tracking-tight transition-colors duration-500 ${phase === 'RECORDING' ? 'text-warm-charcoal' : 'text-warm-charcoal/20'}`}>{time.mins}</p>
            </div>
            <p className="text-warm-charcoal/30 text-[9px] uppercase tracking-[0.3em] font-medium">Min</p>
          </div>
          <div className="flex items-center pt-2 text-terracotta/30 text-2xl font-light opacity-50">:</div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-20 items-center justify-center rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-sm">
              <p className={`text-2xl font-light tracking-tight transition-colors duration-500 ${phase === 'RECORDING' ? 'text-warm-charcoal' : 'text-warm-charcoal/20'}`}>{time.secs}</p>
            </div>
            <p className="text-warm-charcoal/30 text-[9px] uppercase tracking-[0.3em] font-medium">Sec</p>
          </div>
        </div>
      </main>

      <footer className="pb-40 pt-4 px-8 shrink-0 flex flex-col items-center">
        <div 
          className="flex items-center gap-6 bg-white/40 backdrop-blur-2xl border border-white/60 px-6 h-[72px] justify-between rounded-full w-full max-w-xs transition-all duration-500 shadow-xl shadow-warm-charcoal/5"
        >
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-xl transition-all ${phase === 'RECORDING' ? 'text-terracotta' : 'text-warm-charcoal/30'}`}>
              mic
            </span>
            <p className="text-warm-charcoal/40 text-[9px] font-medium uppercase tracking-[0.4em]">
              {phase === 'RECORDING' ? 'Recording' : 'Capture'}
            </p>
          </div>
          <div 
            onClick={handleToggleRecording}
            className={`relative flex h-[30px] w-[54px] items-center rounded-full transition-all duration-300 p-1 cursor-pointer ${phase === 'RECORDING' ? 'bg-terracotta/30 justify-end' : 'bg-warm-charcoal/10 justify-start'}`}
          >
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="h-5 w-5 rounded-full bg-white shadow-md" 
            />
          </div>
        </div>
      </footer>

      {/* Journal Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-warm-charcoal/40 backdrop-blur-lg"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-sm bg-ceramic-white rounded-[42px] p-8 flex flex-col gap-6 shadow-2xl pointer-events-auto border border-white"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="size-10 rounded-full bg-warm-charcoal/5 flex items-center justify-center hover:bg-warm-charcoal/10 transition-colors"
                  title="Discard entry"
                >
                  <span className="material-symbols-outlined text-warm-charcoal/60 text-[20px]">arrow_back</span>
                </button>
                <h3 className="text-warm-charcoal text-[18px] font-medium tracking-tight">Save Sound Journal</h3>
                <div className="size-10"></div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-charcoal/40 ml-4">Journal Title</label>
                  <input 
                    type="text" 
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="E.g., Rain in Kyoto..."
                    className="w-full bg-warm-charcoal/[0.03] border border-warm-charcoal/[0.05] rounded-[24px] px-6 py-4 text-[15px] placeholder:text-warm-charcoal/20 focus:ring-1 focus:ring-terracotta/20 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-charcoal/40 ml-4">Journal Description</label>
                  <textarea 
                    rows={3}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What did you feel?"
                    className="w-full bg-warm-charcoal/[0.03] border border-warm-charcoal/[0.05] rounded-[24px] px-6 py-4 text-[15px] placeholder:text-warm-charcoal/20 focus:ring-1 focus:ring-terracotta/20 transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-charcoal/40 ml-4">Location Origin</label>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={tagLocation}
                        onChange={(e) => setTagLocation(e.target.value)}
                        className="w-full bg-warm-charcoal/[0.03] border border-warm-charcoal/[0.05] rounded-[24px] px-6 py-4 text-[14px] outline-none"
                        placeholder="Detect or type location..."
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className={`size-[56px] rounded-full flex items-center justify-center transition-all ${isDetectingLocation ? 'bg-terracotta/20 animate-pulse' : 'bg-warm-charcoal/5 hover:bg-warm-charcoal/10'}`}
                      title="Pinpoint Location"
                    >
                      <span className={`material-symbols-outlined text-[24px] ${isDetectingLocation ? 'text-terracotta' : 'text-warm-charcoal/60'}`}>
                        {isDetectingLocation ? 'sync' : 'my_location'}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="w-full py-5 bg-terracotta text-white rounded-[24px] text-[16px] font-medium tracking-wide shadow-xl shadow-terracotta/20 flex items-center justify-center gap-3"
                >
                  Add to My Journals
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecordScreen;
