
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BreathingCircle from './components/BreathingCircle';
import Navigation from './components/Navigation';
import RecordScreen from './components/RecordScreen';
import Sidebar from './components/Sidebar';
import JournalArchive from './components/JournalArchive';
import AuthGate from './components/AuthGate';
import { StorageView, PrivacyView, PersonalizationView } from './components/PlaceholderViews';
import { Tab, View, Theme, SavedRecording } from './types';
import { AMBIENT_SOUNDS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const hasPasscode = !!localStorage.getItem('B T W N_passcode');
    const biometricEnabled = localStorage.getItem('aether_biometric_enabled') === 'true';
    return !(hasPasscode || biometricEnabled);
  });
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LISTEN);
  const [currentView, setCurrentView] = useState<View>(View.MAIN);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('aether_theme') as Theme) || Theme.DESERT;
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const isTransitioning = useRef(false);
  
  const skipRef = useRef<(() => void) | null>(null);

  // Seed demo data if empty
  useEffect(() => {
    const existing = localStorage.getItem('aether_recordings');
    if (!existing || JSON.parse(existing).length === 0) {
      const demoEntry: SavedRecording = {
        id: 'demo-entry-1',
        name: 'Midnight Rainfall',
        caption: 'The rhythmic patter against the windowpane felt like a conversation with the sky.',
        location: '123 Gion District, Kyoto, Japan',
        timestamp: '23:42',
        date: 'Oct 24',
        year: '2024',
        duration: 312,
        audioUrl: 'https://cdn.jsdelivr.net/gh/joycepeileung-source/sound-journal-assets/sounds/paris-cafe.mp3'
      };
      localStorage.setItem('aether_recordings', JSON.stringify([demoEntry]));
    }
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('aether_theme', theme);
  }, [theme]);

  const getAmbientList = useCallback(() => {
    const source = (localStorage.getItem('aether_ambient_source') as 'CURATED' | 'PERSONAL') || 'CURATED';
    if (source === 'PERSONAL') {
      const personal = JSON.parse(localStorage.getItem('aether_recordings') || '[]');
      const sequence = JSON.parse(localStorage.getItem('aether_personal_sequence') || '[]');
      
      if (sequence.length > 0) {
        // Filter and order based on the stored sequence of IDs
        return sequence.map((id: string) => {
          const recording = personal.find((p: SavedRecording) => p.id === id);
          if (recording) {
            return {
              id: recording.id,
              location: recording.location,
              url: recording.audioUrl || AMBIENT_SOUNDS[0].url
            };
          }
          return null;
        }).filter(Boolean);
      } else if (personal.length > 0) {
        // Fallback to all personal recordings if no sequence defined
        return personal.map((p: SavedRecording) => ({
          id: p.id,
          location: p.location,
          url: p.audioUrl || AMBIENT_SOUNDS[0].url
        }));
      }
    }
    return AMBIENT_SOUNDS.map(s => ({
      id: s.id,
      location: s.location,
      url: s.url
    }));
  }, []);

  const playNextSound = useCallback(() => {
    if (!audioRef.current || isTransitioning.current) return;

    const list = getAmbientList();
    if (list.length === 0) return;

    const audio = audioRef.current;
    isTransitioning.current = true;

    const fadeDuration = 1500; 
    const startVolume = audio.volume;
    const startTime = performance.now();

    const animateFadeOut = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.max(0, Math.min(elapsed / fadeDuration, 1));
      
      const calculatedVolume = startVolume * (1 - progress);
      audio.volume = Math.max(0, Math.min(1, calculatedVolume));

      if (progress < 1) {
        requestAnimationFrame(animateFadeOut);
      } else {
        audio.pause();
        const nextIndex = (currentSoundIndex + 1) % list.length;
        setCurrentSoundIndex(nextIndex);

        audio.src = list[nextIndex].url;
        audio.load();
        audio.volume = 0; 
        
        if (isListening) {
          audio.play()
            .then(() => {
              const fadeInStartTime = performance.now();
              const animateFadeIn = (fadeInCurrentTime: number) => {
                const fadeInElapsed = fadeInCurrentTime - fadeInStartTime;
                const fadeInProgress = Math.max(0, Math.min(fadeInElapsed / fadeDuration, 1));
                
                audio.volume = Math.max(0, Math.min(1, fadeInProgress));

                if (fadeInProgress < 1) {
                  requestAnimationFrame(animateFadeIn);
                } else {
                  isTransitioning.current = false;
                }
              };
              requestAnimationFrame(animateFadeIn);
            })
            .catch(e => {
              console.warn("Auto-play next sound blocked or failed:", e);
              isTransitioning.current = false;
              setTimeout(() => {
                if (skipRef.current) skipRef.current();
              }, 1000);
            });
        } else {
          audio.volume = 1;
          isTransitioning.current = false;
        }
      }
    };

    requestAnimationFrame(animateFadeOut);
  }, [isListening, currentSoundIndex, getAmbientList]);

  useEffect(() => {
    skipRef.current = playNextSound;
  }, [playNextSound]);

  useEffect(() => {
    const list = getAmbientList();
    const initialUrl = list[0]?.url || AMBIENT_SOUNDS[0].url;
    const audio = new Audio(initialUrl);
    audio.loop = false;
    
    audio.onerror = () => {
      console.warn(`Audio error encountered. Attempting to skip...`);
      setTimeout(() => {
        if (skipRef.current) skipRef.current();
      }, 500);
    };

    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [getAmbientList]); 

  const toggleListening = () => {
    if (!audioRef.current || isTransitioning.current) return;
    const audio = audioRef.current;

    if (isListening) {
      audio.pause();
      setIsListening(false);
    } else {
      audio.volume = 1;
      audio.play()
        .then(() => setIsListening(true))
        .catch(error => {
          console.error("Audio playback error:", error);
          setIsListening(false);
          if (skipRef.current) skipRef.current();
        });
    }
  };

  useEffect(() => {
    let interval: number | undefined;
    if (isListening && activeTab === Tab.LISTEN && currentView === View.MAIN) {
      interval = window.setInterval(() => {
        if (skipRef.current) skipRef.current();
      }, 15000); 
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isListening, activeTab, currentView]);

  const formatDisplayLocation = (loc: string) => {
    const parts = loc.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      // Return only City, Country (last two parts) to avoid long street names
      return parts.slice(-2).join(', ');
    }
    return loc;
  };

  const list = getAmbientList();
  const currentSound = list[currentSoundIndex] || list[0] || { id: 'fallback', location: 'Unknown', url: '' };

  return (
    <div className="relative h-screen w-full flex flex-col bg-bg-page overflow-hidden select-none text-warm-charcoal transition-colors duration-700">
      <div className="fixed inset-0 grain-overlay z-0" />

      <AnimatePresence>
        {!isAuthenticated && (
          <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />
        )}
      </AnimatePresence>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={setCurrentView}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

      <AnimatePresence mode="wait">
        {currentView === View.JOURNAL_ARCHIVE && (
          <JournalArchive key="archive" onBack={() => setCurrentView(View.MAIN)} />
        )}
        {currentView === View.PERSONALIZATION && (
          <PersonalizationView key="personalization" onBack={() => setCurrentView(View.MAIN)} />
        )}
        {currentView === View.STORAGE && (
          <StorageView key="storage" onBack={() => setCurrentView(View.MAIN)} />
        )}
        {currentView === View.PRIVACY && (
          <PrivacyView key="privacy" onBack={() => setCurrentView(View.MAIN)} />
        )}

        {currentView === View.MAIN && (
          <motion.div 
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1"
          >
            {activeTab === Tab.LISTEN ? (
              <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative z-10 flex-1 flex flex-col w-full h-full"
              >
                <header className="absolute top-0 left-0 w-full flex items-center justify-between p-6 pt-12 z-20 bg-transparent">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="pointer-events-auto size-12 rounded-full bg-ceramic-white backdrop-blur-md border border-white flex items-center justify-center ceramic-button"
                  >
                    <span className="material-symbols-outlined text-warm-charcoal/60">menu</span>
                  </button>
                  <div className="size-12" />
                </header>

                <main className="flex-1 flex flex-col items-center justify-between px-8 text-center max-w-md mx-auto w-full relative pt-24 pb-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="z-10 shrink-0"
                  >
                    <h1 className="text-warm-charcoal/70 tracking-wider text-[28px] sm:text-[32px] font-display leading-[1.5] font-normal italic [word-spacing:0.18em]">
                      Between here and <br/>
                      elsewhere
                    </h1>
                  </motion.div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full gap-10 sm:gap-12">
                    <div className="relative scale-110 sm:scale-125">
                      <BreathingCircle isListening={isListening} onClick={toggleListening} />
                    </div>

                    <div className="h-10 flex flex-col items-center justify-center shrink-0">
                      <AnimatePresence mode="wait">
                        {isListening && (
                          <motion.button 
                            key={currentSound.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            onClick={playNextSound}
                            className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-100 active:scale-95 transition-all outline-none"
                          >
                            <div className="flex items-center gap-1.5 opacity-40">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-warm-charcoal leading-none whitespace-nowrap">
                                {formatDisplayLocation(currentSound.location)}
                              </span>
                            </div>
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="h-4" />
                </main>
              </motion.div>
            ) : activeTab === Tab.RECORD ? (
              <RecordScreen key="record" onCancel={() => setActiveTab(Tab.LISTEN)} />
            ) : (
              <motion.div 
                key="browse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="size-20 rounded-full bg-warm-charcoal/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-warm-charcoal/20 text-4xl">public</span>
                  </div>
                  <span className="text-warm-charcoal/30 text-[12px] tracking-[0.4em] uppercase font-bold">Coming Soon</span>
                  <button 
                    onClick={() => setActiveTab(Tab.LISTEN)}
                    className="px-10 py-4 rounded-full border border-warm-charcoal/10 text-[11px] uppercase tracking-widest text-warm-charcoal/50 hover:text-warm-charcoal transition-all"
                  >
                    Return Home
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
