
import React from 'react';
import { motion } from 'framer-motion';
import { Tab } from '../types';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: Tab.LISTEN, icon: 'spatial_audio_off', label: 'Listen' },
    { id: Tab.RECORD, icon: 'mic_external_on', label: 'Journal' },
    { id: Tab.BROWSE, icon: 'public', label: 'Browse' }
  ];

  return (
    <nav className="fixed bottom-6 left-0 w-full flex justify-center items-center gap-8 px-10 z-50 pointer-events-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`group pointer-events-auto flex flex-col items-center justify-center size-14 sm:size-16 rounded-full transition-all duration-500 ceramic-button relative ${
            activeTab === tab.id 
              ? 'text-terracotta border-terracotta/20 bg-white ring-[6px] ring-terracotta/5 shadow-xl shadow-terracotta/10' 
              : 'text-warm-charcoal/30 bg-white/50'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl sm:text-3xl transition-all ${activeTab === tab.id ? 'fill-[1] scale-110' : 'group-hover:text-warm-charcoal/60'}`}>
            {tab.icon}
          </span>
          
          <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.25em] font-black transition-all duration-300 ${
            activeTab === tab.id ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-40 group-hover:translate-y-1'
          }`}>
            {tab.label}
          </span>

          {activeTab === tab.id && (
            <motion.div 
              layoutId="nav-active-dot"
              className="absolute -top-1.5 -right-0.5 w-3 h-3 rounded-full bg-terracotta shadow-[0_0_12px_rgba(198,125,99,0.5)] z-20" 
            />
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
