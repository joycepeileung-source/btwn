
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedRecording } from '../types';
import { AMBIENT_SOUNDS } from '../constants';

interface JournalArchiveProps {
  onBack: () => void;
  onPlayJournal?: () => void; // New prop to notify App to pause ambient sound
}

interface CityMeta {
  impression: string;
  imageUrl: string;
}

const JournalArchive: React.FC<JournalArchiveProps> = ({ onBack, onPlayJournal }) => {
  const [entries, setEntries] = useState<SavedRecording[]>([]);
  const [cityMeta, setCityMeta] = useState<Record<string, CityMeta>>({});
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [favoriteCities, setFavoriteCities] = useState<Set<string>>(new Set());
  
  // Selection & Delete State
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Playback State
  const [playingJournalId, setPlayingJournalId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadCity, setActiveUploadCity] = useState<string | null>(null);

  // Edit State
  const [editingJournal, setEditingJournal] = useState<SavedRecording | null>(null);
  const [editName, setEditName] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('aether_recordings') || '[]');
    setEntries(saved);

    const favs = JSON.parse(localStorage.getItem('aether_favorite_cities') || '[]');
    setFavoriteCities(new Set(favs));

    const meta = JSON.parse(localStorage.getItem('aether_city_meta') || '{}');
    setCityMeta(meta);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const saveEntries = (updatedEntries: SavedRecording[]) => {
    setEntries(updatedEntries);
    localStorage.setItem('aether_recordings', JSON.stringify(updatedEntries));
  };

  const saveCityMeta = (updatedMeta: Record<string, CityMeta>) => {
    setCityMeta(updatedMeta);
    localStorage.setItem('aether_city_meta', JSON.stringify(updatedMeta));
  };

  const handleImpressionChange = (city: string, text: string) => {
    const updated = { ...cityMeta };
    if (!updated[city]) updated[city] = { impression: '', imageUrl: '' };
    updated[city].impression = text;
    saveCityMeta(updated);
  };

  const triggerImageUpload = (city: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveUploadCity(city);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadCity) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updated = { ...cityMeta };
        if (!updated[activeUploadCity]) updated[activeUploadCity] = { impression: '', imageUrl: '' };
        updated[activeUploadCity].imageUrl = base64;
        saveCityMeta(updated);
        setActiveUploadCity(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedIds(new Set());
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingJournalId(null);
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmDeletion = () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    const confirmed = window.confirm(`Permanently delete ${count} selected journal${count > 1 ? 's' : ''}?`);
    
    if (confirmed) {
      const remaining = entries.filter(entry => !selectedIds.has(entry.id));
      saveEntries(remaining);
      
      if (playingJournalId && selectedIds.has(playingJournalId)) {
        if (audioRef.current) audioRef.current.pause();
        setPlayingJournalId(null);
      }

      setSelectedIds(new Set());
      setIsDeleteMode(false);
    }
  };

  const togglePlayback = (journal: SavedRecording, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleteMode) return;
    
    if (playingJournalId === journal.id) {
      audioRef.current?.pause();
      setPlayingJournalId(null);
      return;
    }

    if (audioRef.current) audioRef.current.pause();

    // FIXED: Removed random ambient fallback. Use journal's URL exclusively.
    const urlToPlay = journal.audioUrl;
    
    if (!urlToPlay) {
      alert("No audio data found for this journal entry.");
      return;
    }

    // Notify App to pause ambient sounds
    if (onPlayJournal) onPlayJournal();
    
    const audio = new Audio(urlToPlay);
    audio.onended = () => setPlayingJournalId(null);
    audio.play().catch(err => {
      console.warn("Playback failed:", err);
      alert("This recording is no longer available.");
    });
    
    audioRef.current = audio;
    setPlayingJournalId(journal.id);
  };

  const toggleCityFavorite = (city: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteCities(prev => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      localStorage.setItem('aether_favorite_cities', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const toggleRecordingFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = entries.map(entry => {
      if (entry.id === id) return { ...entry, isFavorite: !entry.isFavorite };
      return entry;
    });
    saveEntries(updated);
  };

  const openEditModal = (journal: SavedRecording, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJournal(journal);
    setEditName(journal.name);
    setEditCaption(journal.caption || '');
    setEditLocation(journal.location);
  };

  const handleSaveEdit = () => {
    if (!editingJournal) return;
    const updated = entries.map(entry => {
      if (entry.id === editingJournal.id) {
        return {
          ...entry,
          name: editName,
          caption: editCaption,
          location: editLocation
        };
      }
      return entry;
    });
    saveEntries(updated);
    setEditingJournal(null);
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
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'B-T-W-N-Sound-Journal-App'
              }
            }
          );
          
          if (!response.ok) throw new Error('Service unavailable');
          
          const data = await response.json();
          const addr = data.address;
          
          const street = addr.road || addr.pedestrian || addr.suburb || '';
          const city = addr.city || addr.town || addr.village || addr.municipality || '';
          const country = addr.country || '';
          
          const formattedAddress = [street, city, country].filter(Boolean).join(', ');
          setEditLocation(formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (error) {
          console.warn("Offline fallback for geocoding:", error);
          setEditLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        alert("Unable to reach GPS satellites.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const toggleCityExpand = (city: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  };

  const groupedByCity = useMemo(() => {
    const groups: Record<string, { journals: SavedRecording[], lastVisit: string }> = {};
    entries.forEach(entry => {
      const parts = entry.location.split(',');
      const city = parts.length >= 2 ? parts[parts.length - 2].trim() : entry.location || 'Unknown Location';
      if (!groups[city]) groups[city] = { journals: [], lastVisit: entry.date };
      groups[city].journals.push(entry);
      const currentLast = new Date(groups[city].lastVisit).getTime();
      const entryDate = new Date(entry.date).getTime();
      if (entryDate > currentLast) groups[city].lastVisit = entry.date;
    });
    return groups;
  }, [entries]);

  const cityNames = useMemo(() => {
    return Object.keys(groupedByCity).sort((a, b) => {
      if (favoriteCities.has(a) && !favoriteCities.has(b)) return -1;
      if (!favoriteCities.has(a) && favoriteCities.has(b)) return 1;
      return a.localeCompare(b);
    });
  }, [groupedByCity, favoriteCities]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden"
      style={{ fontFamily: 'Lexend, sans-serif' }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <header className="flex items-center justify-between p-6 pt-10">
        <button 
          onClick={isDeleteMode ? toggleDeleteMode : onBack}
          className="text-warm-charcoal flex h-10 items-center justify-center hover:bg-warm-charcoal/5 px-4 rounded-full transition-colors"
        >
          {isDeleteMode ? (
            <span className="text-sm font-semibold tracking-tight">Cancel</span>
          ) : (
            <span className="material-symbols-outlined">arrow_back</span>
          )}
        </button>

        {!isDeleteMode ? (
          <h2 className="text-[10px] uppercase tracking-[0.5em] text-warm-charcoal/20 font-black">Archive</h2>
        ) : (
          <div className="px-3 py-1 rounded-full bg-warm-charcoal/5 text-[10px] uppercase tracking-widest font-black text-warm-charcoal/40">
            {selectedIds.size} Selected
          </div>
        )}

        {isDeleteMode ? (
          <button 
            onClick={confirmDeletion}
            disabled={selectedIds.size === 0}
            className={`h-10 px-4 rounded-full text-sm font-bold transition-all ${selectedIds.size === 0 ? 'text-warm-charcoal/10 cursor-not-allowed' : 'text-terracotta hover:bg-terracotta/5 active:scale-95'}`}
          >
            Delete
          </button>
        ) : (
          entries.length > 0 && (
            <button 
              onClick={toggleDeleteMode}
              className="flex size-10 items-center justify-center rounded-full text-warm-charcoal/20 hover:text-terracotta hover:bg-terracotta/5 transition-all"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-20">
        <div className="max-w-md mx-auto w-full pt-4">
          {!isDeleteMode && entries.length > 0 && (
            <div className="mb-10">
              <h1 className="text-[#151711] text-[32px] font-bold tracking-tight mb-1">Sound Journals</h1>
              <p className="text-warm-charcoal/40 text-[14px]">The path you've carved through the world.</p>
            </div>
          )}

          <div className="relative">
            <div className="flex flex-col">
              {cityNames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-20 gap-4">
                  <span className="material-symbols-outlined text-5xl">location_off</span>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black">No Journals Recorded</p>
                </div>
              ) : (
                cityNames.map((city, index) => {
                  const isExpanded = expandedCities.has(city);
                  const isFavorite = favoriteCities.has(city);
                  const data = groupedByCity[city];
                  const meta = cityMeta[city] || { impression: '', imageUrl: '' };
                  const isLast = index === cityNames.length - 1;

                  return (
                    <div key={city} className="flex flex-col relative">
                      {!isLast && (
                        <div className="absolute left-[19.5px] top-[44px] bottom-[-20px] w-[1.5px] bg-[#D4D9D0] -z-10" />
                      )}

                      <div className="flex gap-5 mb-4 items-start group">
                        <div 
                          onClick={(e) => triggerImageUpload(city, e)}
                          className="relative flex-shrink-0 cursor-pointer"
                        >
                          <div 
                            className={`size-10 rounded-full bg-center bg-cover ring-4 ring-white shadow-md transition-all duration-500 overflow-hidden flex items-center justify-center bg-warm-charcoal/5 hover:ring-warm-charcoal/10 ${meta.imageUrl ? '' : 'border border-dashed border-warm-charcoal/20'}`}
                            style={meta.imageUrl ? { backgroundImage: `url(${meta.imageUrl})` } : {}}
                          >
                            {!meta.imageUrl && (
                              <span className="material-symbols-outlined text-warm-charcoal/20 text-lg">add_a_photo</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <div 
                            onClick={() => toggleCityExpand(city)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <h3 className="text-[#151711] text-[17px] font-bold leading-tight truncate">
                              {city}
                            </h3>
                            <motion.span 
                              animate={{ rotate: isExpanded ? 0 : -90 }} 
                              className="material-symbols-outlined text-warm-charcoal/20 text-sm"
                            >
                              expand_more
                            </motion.span>
                          </div>
                          
                          <input 
                            type="text"
                            value={meta.impression}
                            onChange={(e) => handleImpressionChange(city, e.target.value)}
                            placeholder="Add a city impression..."
                            className="w-full bg-transparent border-none p-0 shadow-none ring-0 focus:ring-0 text-[12px] text-warm-charcoal/40 font-medium italic focus:text-terracotta transition-colors outline-none placeholder:text-warm-charcoal/20 mt-0.5"
                          />
                        </div>

                        {!isDeleteMode && (
                          <button onClick={(e) => toggleCityFavorite(city, e)} className="p-2 -mr-2">
                            <span 
                              className={`material-symbols-outlined text-[20px] ${isFavorite ? 'text-terracotta fill-[1]' : 'text-warm-charcoal/10'}`} 
                              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              favorite
                            </span>
                          </button>
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ml-14 mb-8"
                          >
                            <div className="flex flex-col gap-4 pt-2">
                              {data.journals.map((journal) => {
                                const isPlaying = playingJournalId === journal.id;
                                const isSelected = selectedIds.has(journal.id);
                                return (
                                  <motion.div 
                                    layout
                                    key={journal.id}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 10, opacity: 0 }}
                                    onClick={(e) => isDeleteMode ? toggleSelection(journal.id, e) : null}
                                    className={`flex flex-col gap-3 p-4 rounded-3xl border transition-all duration-300 ${isDeleteMode ? (isSelected ? 'bg-terracotta/[0.04] border-terracotta/20' : 'bg-white border-warm-charcoal/5') : 'bg-warm-charcoal/[0.03] border-transparent hover:bg-warm-charcoal/[0.06] cursor-default'}`}
                                  >
                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
                                      <span className={`text-[15px] font-bold truncate transition-colors ${isSelected ? 'text-terracotta' : 'text-[#151711]'}`}>
                                        {journal.name}
                                      </span>

                                      <span className="text-[10px] text-warm-charcoal/15">•</span>

                                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                                        <span className="text-[10px] font-medium text-warm-charcoal/40 tracking-[0.1em] uppercase">
                                          {journal.timestamp}
                                        </span>
                                        <span className="text-[10px] font-medium text-warm-charcoal/30 tracking-[0.1em] uppercase">
                                          {journal.date}
                                        </span>
                                      </div>
                                      
                                      {journal.caption && (
                                        <>
                                          <span className="text-[10px] text-warm-charcoal/15">•</span>
                                          <span className="text-[11px] italic text-warm-charcoal/35 font-medium truncate flex-1 min-w-[80px]">
                                            {journal.caption}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-warm-charcoal/[0.04]">
                                      <div className="flex items-center gap-1 shrink-0">
                                        {isDeleteMode ? (
                                          <div className={`size-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-terracotta border-terracotta text-white' : 'border-warm-charcoal/10 bg-white'}`}>
                                            {isSelected && <span className="material-symbols-outlined text-xs font-black">done</span>}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <button 
                                              onClick={(e) => toggleRecordingFavorite(journal.id, e)}
                                              className="size-9 rounded-full flex items-center justify-center text-warm-charcoal/20 hover:text-terracotta transition-colors"
                                            >
                                              <span 
                                                className={`material-symbols-outlined text-[22px] ${journal.isFavorite ? 'text-terracotta fill-[1]' : ''}`}
                                                style={{ fontVariationSettings: journal.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                                              >
                                                favorite
                                              </span>
                                            </button>
                                            <button 
                                              onClick={(e) => openEditModal(journal, e)}
                                              className="size-9 rounded-full flex items-center justify-center text-warm-charcoal/20 hover:text-warm-charcoal/60 transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-[22px]">edit</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {!isDeleteMode && (
                                        <div className="flex items-center gap-4">
                                          <span className="text-[10px] font-black text-warm-charcoal/10 tracking-[0.25em]">{formatDuration(journal.duration)}</span>
                                          <button 
                                            onClick={(e) => togglePlayback(journal, e)}
                                            className={`size-11 rounded-full shadow-lg flex items-center justify-center transition-all ${isPlaying ? 'bg-terracotta text-white scale-110' : 'bg-white text-warm-charcoal/40 hover:text-terracotta active:scale-95'}`}
                                          >
                                            <span className="material-symbols-outlined text-[24px]">
                                              {isPlaying ? 'pause' : 'play_arrow'}
                                            </span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {editingJournal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-warm-charcoal/40 backdrop-blur-lg"
              onClick={() => setEditingJournal(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-sm bg-ceramic-white rounded-[42px] p-8 flex flex-col gap-6 shadow-2xl pointer-events-auto border border-white"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <button 
                  onClick={() => setEditingJournal(null)}
                  className="size-10 rounded-full bg-warm-charcoal/5 flex items-center justify-center hover:bg-warm-charcoal/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-warm-charcoal/60 text-[20px]">close</span>
                </button>
                <h3 className="text-warm-charcoal text-[18px] font-medium tracking-tight">Edit Entry</h3>
                <div className="size-10"></div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-warm-charcoal/40 ml-4">Journal Title</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-warm-charcoal/[0.03] border border-warm-charcoal/[0.05] rounded-[24px] px-6 py-4 text-[15px] outline-none focus:ring-1 focus:ring-terracotta/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-warm-charcoal/40 ml-4">Entry Description</label>
                  <textarea 
                    rows={3}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full bg-warm-charcoal/[0.03] border border-warm-charcoal/[0.05] rounded-[24px] px-6 py-4 text-[15px] outline-none focus:ring-1 focus:ring-terracotta/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-warm-charcoal/40 ml-4">Location Origin</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="flex-1 bg-warm-charcoal/[0.03] border border-warm-charcoal/[0.05] rounded-[24px] px-6 py-4 text-[14px] outline-none"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className={`size-[56px] rounded-full flex items-center justify-center transition-all ${isDetectingLocation ? 'bg-terracotta/20 animate-pulse' : 'bg-warm-charcoal/5 hover:bg-warm-charcoal/10'}`}
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
                  onClick={handleSaveEdit}
                  className="w-full py-5 bg-terracotta text-white rounded-[24px] text-[16px] font-semibold tracking-wide shadow-xl shadow-terracotta/20"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default JournalArchive;
