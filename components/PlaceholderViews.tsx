
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedRecording } from '../types';

interface PlaceholderProps {
  title: string;
  icon: string;
  onBack: () => void;
}

export const PersonalizationView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [source, setSource] = useState<'CURATED' | 'PERSONAL'>(() => {
    return (localStorage.getItem('aether_ambient_source') as 'CURATED' | 'PERSONAL') || 'CURATED';
  });
  const [showSequenceSelector, setShowSequenceSelector] = useState(false);
  const [personalJournals, setPersonalJournals] = useState<SavedRecording[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('aether_personal_sequence') || '[]');
  });

  useEffect(() => {
    const recordings = JSON.parse(localStorage.getItem('aether_recordings') || '[]');
    // Sort by date/time descending to show most recent first in the selector list
    const sorted = [...recordings].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.year} ${a.timestamp}`).getTime();
      const dateB = new Date(`${b.date} ${b.year} ${b.timestamp}`).getTime();
      return dateB - dateA;
    });
    setPersonalJournals(sorted);
  }, []);

  const handleSourceChange = (newSource: 'CURATED' | 'PERSONAL') => {
    setSource(newSource);
    localStorage.setItem('aether_ambient_source', newSource);
    if (newSource === 'PERSONAL' && selectedSequence.length === 0) {
      setShowSequenceSelector(true);
    }
  };

  const toggleJournalSelection = (id: string) => {
    setSelectedSequence(prev => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter(item => item !== id);
      } else {
        next = [...prev, id];
      }
      localStorage.setItem('aether_personal_sequence', JSON.stringify(next));
      return next;
    });
  };

  const options = [
    {
      id: 'CURATED',
      label: 'Curated Atmosphere',
      description: 'Explore a global collection of high-fidelity environmental sounds from the Aether library.',
      icon: 'spatial_tracking'
    },
    {
      id: 'PERSONAL',
      label: 'Personal Journey',
      description: 'Experience your own memories as the background of your home screen using your recorded sound journals.',
      icon: 'settings_input_antenna'
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed inset-0 z-[100] bg-bg-page flex flex-col overflow-hidden">
      <div className="fixed inset-0 grain-overlay z-0" />
      <header className="relative z-10 flex items-center justify-between p-6 pt-10">
        <button onClick={onBack} className="size-11 rounded-full bg-white/50 backdrop-blur-md border border-white/80 flex items-center justify-center ceramic-button">
          <span className="material-symbols-outlined text-warm-charcoal/60 text-xl">arrow_back</span>
        </button>
        <div className="size-11" />
      </header>
      <main className="relative z-10 flex-1 flex flex-col px-8 pb-10 w-full max-w-md mx-auto overflow-hidden">
        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-warm-charcoal leading-tight tracking-tight mb-1.5 font-display">Personalization</h1>
          <p className="text-warm-charcoal/50 text-[14px] leading-snug font-display">Customize the source of your home screen atmosphere.</p>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-[11px] font-black text-warm-charcoal/20 uppercase tracking-[0.3em] mb-2">Atmosphere Mode</span>
          {options.map((opt) => (
            <div key={opt.id} className="flex flex-col gap-2">
              <button
                onClick={() => handleSourceChange(opt.id as 'CURATED' | 'PERSONAL')}
                className={`relative flex flex-col gap-3 p-6 rounded-[32px] border text-left transition-all duration-500 ${
                  source === opt.id 
                  ? 'bg-ceramic-white border-terracotta/30 shadow-xl shadow-terracotta/5' 
                  : 'bg-warm-charcoal/[0.03] border-transparent hover:bg-warm-charcoal/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <span className={`material-symbols-outlined ${source === opt.id ? 'text-terracotta' : 'text-warm-charcoal/30'}`}>{opt.icon}</span>
                  </div>
                  {source === opt.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="size-6 rounded-full bg-terracotta flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[14px] font-black">done</span>
                    </motion.div>
                  )}
                </div>
                <div>
                  <h4 className={`text-[16px] font-bold leading-tight mb-1 ${source === opt.id ? 'text-warm-charcoal' : 'text-warm-charcoal/60'}`}>{opt.label}</h4>
                  <p className="text-[12px] text-warm-charcoal/40 font-medium leading-relaxed">{opt.description}</p>
                </div>
              </button>
              
              {opt.id === 'PERSONAL' && source === 'PERSONAL' && (
                <button 
                  onClick={() => setShowSequenceSelector(true)}
                  className="mx-6 py-3 px-6 rounded-2xl bg-warm-charcoal/[0.05] text-[11px] font-bold uppercase tracking-widest text-warm-charcoal/60 hover:bg-warm-charcoal/10 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">list_alt</span>
                  Configure Journey Sequence
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Sequence Selector Popup */}
      <AnimatePresence>
        {showSequenceSelector && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-warm-charcoal/40 backdrop-blur-md pointer-events-auto"
              onClick={() => setShowSequenceSelector(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-ceramic-white rounded-t-[42px] sm:rounded-[42px] p-8 flex flex-col gap-6 shadow-2xl pointer-events-auto border border-white max-h-[85vh]"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex flex-col">
                   <h3 className="text-warm-charcoal text-[20px] font-bold tracking-tight">Your Journey Order</h3>
                   <p className="text-[12px] text-warm-charcoal/40 font-medium">Select journals to define your atmosphere order.</p>
                </div>
                <button 
                  onClick={() => setShowSequenceSelector(false)}
                  className="size-10 rounded-full bg-warm-charcoal/5 flex items-center justify-center hover:bg-warm-charcoal/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-warm-charcoal/60 text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {personalJournals.length === 0 ? (
                  <div className="py-12 text-center opacity-30">
                    <span className="material-symbols-outlined text-4xl mb-2">history_edu</span>
                    <p className="text-xs uppercase tracking-widest font-black">No journals found</p>
                  </div>
                ) : (
                  personalJournals.map((journal) => {
                    const selectedIndex = selectedSequence.indexOf(journal.id);
                    const isSelected = selectedIndex !== -1;
                    
                    // Simple City/Country format for the list too
                    const parts = journal.location.split(',').map(p => p.trim());
                    const listLocation = parts.length >= 2 ? parts.slice(-2).join(', ') : journal.location;

                    return (
                      <button
                        key={journal.id}
                        onClick={() => toggleJournalSelection(journal.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 text-left ${
                          isSelected 
                          ? 'bg-terracotta/[0.04] border-terracotta/20' 
                          : 'bg-warm-charcoal/[0.02] border-transparent'
                        }`}
                      >
                        <div className={`size-8 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                          ? 'bg-terracotta border-terracotta text-white shadow-lg shadow-terracotta/20' 
                          : 'border-warm-charcoal/10 bg-white/50 text-warm-charcoal/20'
                        }`}>
                          {isSelected ? (
                            <span className="text-xs font-black">{selectedIndex + 1}</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">add</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-[14px] font-bold text-warm-charcoal truncate">{journal.name}</h5>
                          <p className="text-[10px] text-warm-charcoal/40 font-medium truncate">{listLocation}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSequenceSelector(false)}
                  className="w-full py-5 bg-terracotta text-white rounded-[24px] text-[16px] font-bold tracking-wide shadow-xl shadow-terracotta/20"
                >
                  Set Journey Atmosphere
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PasscodeSetup: React.FC<{ onComplete: (code: string) => void, onCancel: () => void }> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'SET' | 'CONFIRM'>('SET');
  const [passcode, setPasscode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState(false);

  const handleKeyClick = (num: string) => {
    if (step === 'SET') {
      if (passcode.length < 4) {
        const next = passcode + num;
        setPasscode(next);
        if (next.length === 4) {
          setTimeout(() => setStep('CONFIRM'), 300);
        }
      }
    } else {
      if (confirmCode.length < 4) {
        const next = confirmCode + num;
        setConfirmCode(next);
        if (next.length === 4) {
          if (next === passcode) {
            onComplete(next);
          } else {
            setError(true);
            setTimeout(() => {
              setConfirmCode('');
              setError(false);
            }, 600);
          }
        }
      }
    }
  };

  const currentPass = step === 'SET' ? passcode : confirmCode;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[150] bg-bg-page flex flex-col p-8 items-center"
    >
      <div className="fixed inset-0 grain-overlay z-0" />
      <header className="w-full flex justify-between items-center mb-16 relative z-10">
        <button onClick={onCancel} className="p-2 opacity-30 hover:opacity-100"><span className="material-symbols-outlined">close</span></button>
        <div className="text-center">
          <h2 className="text-sm font-bold tracking-tight text-warm-charcoal">{step === 'SET' ? 'Set Passcode' : 'Confirm Passcode'}</h2>
          <p className="text-[10px] text-warm-charcoal/40 uppercase tracking-widest font-black mt-1">4-Digit Security</p>
        </div>
        <div className="size-10" />
      </header>

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
        <div className="flex gap-4 mb-20">
          {[0,1,2,3].map(i => (
            <motion.div 
              key={i} 
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              className={`size-3 rounded-full border-2 ${currentPass.length > i ? 'bg-terracotta border-terracotta shadow-lg' : 'border-warm-charcoal/10'}`} 
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-x-8 gap-y-6">
          {['1','2','3','4','5','6','7','8','9'].map(num => (
            <button key={num} onClick={() => handleKeyClick(num)} className="size-16 rounded-full bg-white/40 border border-white flex items-center justify-center text-xl font-medium ceramic-button active:scale-90 transition-all">{num}</button>
          ))}
          <div />
          <button onClick={() => handleKeyClick('0')} className="size-16 rounded-full bg-white/40 border border-white flex items-center justify-center text-xl font-medium ceramic-button active:scale-90 transition-all">0</button>
          <button onClick={() => { if (step === 'SET') setPasscode(p => p.slice(0,-1)); else setConfirmCode(p => p.slice(0,-1)); }} className="size-16 flex items-center justify-center text-warm-charcoal/20"><span className="material-symbols-outlined">backspace</span></button>
        </div>
      </div>
    </motion.div>
  );
};
export const SharePreview: React.FC<{ 
  journal: SavedRecording; 
  onBack: () => void;
  imageUrl?: string;
}> = ({ journal, onBack, imageUrl }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const locationParts = journal.location.split(',').map(p => p.trim());
  let displayLocation = journal.location;
  if (locationParts.length >= 3) {
    displayLocation = `${locationParts[1]}, ${locationParts[2]}`;
  } else if (locationParts.length === 2) {
    displayLocation = `${locationParts[0]}, ${locationParts[1]}`;
  }

  const shareUrl = `https://www.google.com/search?q=${encodeURIComponent(displayLocation + " aether soundscapes")}`;
  const shareText = `Listening to the memory of ${displayLocation} on Aether.`;

  const handleNativeShare = async (platformName: string, fallbackUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aether Sound Journal',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.debug('Native share cancelled or failed, falling back to URL.', err);
        window.open(fallbackUrl, '_blank');
      }
    } else {
      window.open(fallbackUrl, '_blank');
    }
  };

  const sharePlatforms = [
    { name: 'Instagram', icon: 'https://cdn.simpleicons.org/instagram/5C544E', url: 'https://instagram.com' },
    { name: 'WhatsApp', icon: 'https://cdn.simpleicons.org/whatsapp/5C544E', url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}` },
    { name: 'Facebook', icon: 'https://cdn.simpleicons.org/facebook/5C544E', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'WeChat', icon: 'https://cdn.simpleicons.org/wechat/5C544E', url: 'https://wechat.com' },
  ];

  const handleSaveToPhotos = () => {
    if (isSaved) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
    }, 1500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}&bgcolor=FDFCFB00&color=5C544E&margin=2&qzone=2`;


  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[200] bg-bg-page flex flex-col overflow-hidden clay-gradient-bg"
    >
      <div className="fixed inset-0 grain-overlay z-0" />
      <header className="relative z-10 flex items-center justify-between p-4 pt-4 shrink-0">
        <button onClick={onBack} className="p-2 opacity-30 hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-warm-charcoal text-3xl">expand_more</span></button>
        <div className="size-10" />
        <button className="p-2 opacity-30 hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-warm-charcoal text-3xl">more_horiz</span></button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-10 items-center justify-between pb-8 pt-0 max-w-md mx-auto w-full overflow-hidden">
        <div className="w-full flex-1 flex items-center justify-center min-h-0 pt-4">
          <div className="relative group">
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-[-40px] bg-terracotta blur-[60px] rounded-full pointer-events-none" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="size-44 sm:size-52 rounded-[64px] bg-white/40 backdrop-blur-2xl p-8 flex flex-col items-center justify-center border border-white/80 shadow-2xl shadow-warm-charcoal/5 relative">
              <div className="relative w-full h-full p-2 bg-white/50 rounded-[40px] flex items-center justify-center border border-white/60">
                <img src={qrCodeUrl} alt="Scan to listen" className="w-full h-full object-contain opacity-50 mix-blend-multiply" />
              </div>
              <div className="absolute -bottom-7 w-full text-center">
                 <span className="text-[7px] uppercase tracking-[0.5em] text-warm-charcoal/30 font-black">Scan To Listen</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center shrink-0 mt-10 mb-6">
          <div className="text-center mb-6 px-2">
            <h2 className="text-[22px] sm:text-[26px] font-bold text-warm-charcoal font-display leading-tight tracking-tight">{displayLocation}</h2>
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-warm-charcoal/20 font-display mt-1 block">{journal.name.toUpperCase()}</span>
          </div>
          <div className="w-full px-8">
            <div className="relative h-[2px] w-full bg-warm-charcoal/5 rounded-full mb-2">
              <div className="absolute top-0 left-0 h-full w-[43%] bg-terracotta/40 rounded-full" />
              <div className="absolute top-1/2 left-[43%] -translate-y-1/2 size-2.5 bg-terracotta rounded-full shadow-md border-[2.5px] border-bg-page" />
            </div>
            <div className="flex justify-between text-[8px] font-bold text-warm-charcoal/20 tracking-widest font-display">
              <span>02:10</span>
              <span>05:00</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-10 shrink-0 mb-6">
          <button className="text-warm-charcoal/15 hover:text-warm-charcoal/40 transition-colors"><span className="material-symbols-outlined text-[24px]">skip_previous</span></button>
          <div className="relative">
            <motion.div animate={{ opacity: [0.02, 0.06, 0.02], scale: [1, 1.15, 1] }} transition={{ duration: 7, repeat: Infinity }} className="absolute inset-0 bg-terracotta/10 blur-xl rounded-full" />
            <button className="relative size-14 rounded-full bg-white/40 border border-white shadow-lg flex items-center justify-center text-warm-charcoal/50 group hover:text-warm-charcoal transition-all"><span className="material-symbols-outlined text-[28px]">pause</span></button>
          </div>
          <button className="text-warm-charcoal/15 hover:text-warm-charcoal/40 transition-colors"><span className="material-symbols-outlined text-[24px]">skip_next</span></button>
        </div>

        <div className="px-10 text-center shrink-0 mb-8 min-h-[44px]">
          <p className="text-[15px] sm:text-[17px] font-serif-display italic text-warm-charcoal/35 leading-relaxed font-normal line-clamp-2">"{journal.caption}"</p>
        </div>

        <div className="w-full flex flex-col items-center gap-6 pt-2 pb-8 shrink-0">
          <div className="flex justify-center gap-4 sm:gap-5">
            {sharePlatforms.map((p) => (
              <button key={p.name} onClick={() => handleNativeShare(p.name, p.url)} className="size-11 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center border border-white hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-sm">
                <img src={p.icon} className="size-4.5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100" alt={p.name} />
              </button>
            ))}
          </div>
          <button 
            onClick={handleSaveToPhotos} 
            disabled={isSaving || isSaved} 
            className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-2 ${
              isSaving || isSaved ? 'opacity-50 cursor-default text-terracotta' : 'text-warm-charcoal/30 hover:text-warm-charcoal/60 cursor-pointer'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isSaved ? 'check_circle' : 'download'}
            </span>
            {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save to Photo Album'}
          </button>
        </div>
      </main>
    </motion.div>
  );
};

export const StorageView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({ journals: 20, cities: 50, free: 58, total: 128 });

  useEffect(() => {
    const recordings = JSON.parse(localStorage.getItem('aether_recordings') || '[]');
    const journalSize = Math.max(0.1, (recordings.length * 0.05)); 
    setStats(prev => ({ ...prev, journals: Math.round(journalSize * 10) / 10, free: Math.round((prev.total - prev.cities - journalSize) * 10) / 10 }));
  }, []);

  const handleClearCache = () => {
    setIsClearing(true);
    setTimeout(() => {
      localStorage.removeItem('aether_city_meta');
      localStorage.removeItem('aether_favorite_cities');
      setStats(prev => ({ ...prev, cities: 0, free: Math.round((prev.total - prev.journals) * 10) / 10 }));
      setIsClearing(false);
      alert("Cache cleared successfully.");
    }, 800);
  };

  const handleDeleteAll = () => {
    if (window.confirm("Are you sure? This will permanently erase all your sound journals.")) {
      setIsDeleting(true);
      setTimeout(() => {
        localStorage.removeItem('aether_recordings');
        setStats(prev => ({ ...prev, journals: 0, free: Math.round((prev.total - prev.cities) * 10) / 10 }));
        setIsDeleting(false);
        alert("All offline data has been deleted.");
      }, 1200);
    }
  };

  const usagePercentage = Math.round(((stats.total - stats.free) / stats.total) * 100);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed inset-0 z-[100] bg-bg-page flex flex-col overflow-hidden">
      <div className="fixed inset-0 grain-overlay z-0" />
      <header className="relative z-10 flex items-center justify-between p-6 pt-10">
        <button onClick={onBack} className="size-11 rounded-full bg-white/50 backdrop-blur-md border border-white/80 flex items-center justify-center ceramic-button"><span className="material-symbols-outlined text-warm-charcoal/60 text-xl">arrow_back</span></button>
        <div className="size-11" />
      </header>
      <main className="relative z-10 flex-1 flex flex-col px-8 pb-10 w-full max-w-md mx-auto overflow-hidden">
        <div className="mb-6"><h1 className="text-[28px] font-bold text-warm-charcoal leading-tight tracking-tight mb-1.5 font-display">Storage Management</h1><p className="text-warm-charcoal/50 text-[14px] leading-snug font-display">Manage your offline data to free up space on your device.</p></div>
        <section className="mb-6"><h3 className="text-[13px] font-semibold text-warm-charcoal/80 mb-3 uppercase tracking-widest font-display">Storage Used</h3><div className="w-full h-2.5 bg-warm-charcoal/5 rounded-full overflow-hidden mb-2.5"><motion.div initial={{ width: 0 }} animate={{ width: `${usagePercentage}%` }} transition={{ duration: 1.2, ease: "circOut" }} className="h-full bg-terracotta rounded-full" /></div><p className="text-xs font-medium text-warm-charcoal/40 font-display">{usagePercentage}% of {stats.total}GB</p></section>
        <div className="space-y-3 mb-6">{[{ label: 'Journal Entries', value: `${stats.journals}GB` }, { label: 'Downloaded Cities', value: `${stats.cities}GB` }, { label: 'Free Space', value: `${stats.free}GB`, isHighlight: true }].map((item, idx) => (<div key={idx} className="flex items-center justify-between pb-3 border-b border-warm-charcoal/5"><span className={`text-[14px] font-display ${item.isHighlight ? 'text-warm-charcoal/40' : 'text-warm-charcoal/60'}`}>{item.label}</span><span className="text-[14px] font-medium text-warm-charcoal font-display">{item.value}</span></div>))}<div className="flex items-center justify-between py-1.5"><span className="text-[14px] text-warm-charcoal/60 font-display">Clear Cache</span><button onClick={handleClearCache} disabled={isClearing} className={`px-6 py-2 rounded-full text-xs font-bold transition-all font-display ${isClearing ? 'bg-warm-charcoal/5 text-warm-charcoal/20' : 'bg-warm-charcoal/5 text-warm-charcoal hover:bg-warm-charcoal/10 active:scale-95'}`}>{isClearing ? 'Clearing...' : 'Clear'}</button></div></div>
        <div className="mt-auto"><motion.button whileTap={{ scale: 0.98 }} onClick={handleDeleteAll} disabled={isDeleting} className={`w-full py-4.5 rounded-[20px] font-bold text-[15px] transition-all flex items-center justify-center gap-2 font-display ${isDeleting ? 'bg-warm-charcoal/5 text-warm-charcoal/20 border border-transparent' : 'bg-warm-charcoal/[0.04] border border-warm-charcoal/[0.06] text-warm-charcoal hover:bg-warm-charcoal/[0.08]'}`}>{isDeleting ? (<><span className="size-4 rounded-full border-2 border-warm-charcoal/20 border-t-warm-charcoal animate-spin" />Deleting...</>) : ('Delete All Offline Data')}</motion.button></div>
      </main>
    </motion.div>
  );
};

export const PrivacyView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [passcodeEnabled, setPasscodeEnabled] = useState(() => !!localStorage.getItem('aether_passcode'));
  const [biometricEnabled, setBiometricEnabled] = useState(() => localStorage.getItem('aether_biometric_enabled') === 'true');
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);

  const togglePasscode = () => {
    if (passcodeEnabled) {
      if (window.confirm("Disable passcode lock?")) {
        localStorage.removeItem('aether_passcode');
        setPasscodeEnabled(false);
      }
    } else {
      setShowPasscodeSetup(true);
    }
  };

  const handlePasscodeSet = (code: string) => {
    localStorage.setItem('aether_passcode', code);
    setPasscodeEnabled(true);
    setShowPasscodeSetup(false);
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      localStorage.setItem('aether_biometric_enabled', 'false');
      setBiometricEnabled(false);
    } else {
      // Simulate real biometric setup
      if (window.PublicKeyCredential) {
        try {
          // Native request simulation
          alert("Aether would like to use Face ID for authentication.");
          localStorage.setItem('aether_biometric_enabled', 'true');
          setBiometricEnabled(true);
        } catch (e) {
          alert("Biometrics not available on this device.");
        }
      } else {
        alert("Your device doesn't support web biometrics.");
      }
    }
  };

  const handleRequestDeletion = () => {
    if (window.confirm("Requesting data deletion will clear all your locally stored journals and preferences. Proceed?")) {
      localStorage.clear();
      alert("Data deletion request processed. Your local data has been cleared.");
      window.location.reload();
    }
  };

  return (
    <>
      <AnimatePresence>
        {showPasscodeSetup && (
          <PasscodeSetup onComplete={handlePasscodeSet} onCancel={() => setShowPasscodeSetup(false)} />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed inset-0 z-[100] bg-bg-page flex flex-col overflow-hidden">
        <div className="fixed inset-0 grain-overlay z-0" />
        <header className="relative z-10 flex items-center justify-between p-6 pt-10">
          <button onClick={onBack} className="size-11 rounded-full bg-white/50 backdrop-blur-md border border-white/80 flex items-center justify-center ceramic-button"><span className="material-symbols-outlined text-warm-charcoal/60 text-xl">arrow_back</span></button>
          <div className="size-11" />
        </header>

        <main className="relative z-10 flex-1 flex flex-col px-8 pb-10 w-full max-w-md mx-auto overflow-hidden">
          <div className="mb-10"><h1 className="text-[28px] font-bold text-warm-charcoal leading-tight tracking-tight mb-1.5 font-display">Privacy</h1><p className="text-warm-charcoal/50 text-[14px] leading-snug font-display">Manage your personal data and security settings.</p></div>
          <div className="space-y-6 mb-10">
            <div className="flex items-center justify-between pb-4 border-b border-warm-charcoal/5">
              <span className="text-[15px] font-medium text-warm-charcoal font-display">Passcode Lock</span>
              <button onClick={togglePasscode} className={`relative w-12 h-7 rounded-full transition-colors duration-500 p-1 flex items-center ${passcodeEnabled ? 'bg-terracotta' : 'bg-warm-charcoal/10'}`}><motion.div layout className="h-5 w-5 rounded-full bg-white shadow-sm" animate={{ x: passcodeEnabled ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} /></button>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-warm-charcoal/5">
              <span className="text-[15px] font-medium text-warm-charcoal font-display">Biometric Login</span>
              <button onClick={toggleBiometric} className={`relative w-12 h-7 rounded-full transition-colors duration-500 p-1 flex items-center ${biometricEnabled ? 'bg-terracotta' : 'bg-warm-charcoal/10'}`}><motion.div layout className="h-5 w-5 rounded-full bg-white shadow-sm" animate={{ x: biometricEnabled ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} /></button>
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-6"><button onClick={handleRequestDeletion} className="text-[14px] font-bold text-warm-charcoal/30 hover:text-warm-charcoal/60 transition-colors font-display uppercase tracking-[0.2em]">Request Data Deletion</button></div>
        </main>
      </motion.div>
    </>
  );
};
