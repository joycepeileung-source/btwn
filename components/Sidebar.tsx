
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Theme } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentTheme, onThemeChange }) => {
  const menuItems = [
    { id: 'online', label: 'Go Online', icon: 'public', view: null, disabled: true },
    { id: 'journals', label: 'My Journals', icon: 'auto_stories', view: View.JOURNAL_ARCHIVE },
    { id: 'personalization', label: 'Personalization', icon: 'settings_input_antenna', view: View.PERSONALIZATION },
    { id: 'storage', label: 'Storage Management', icon: 'database', view: View.STORAGE },
    { id: 'privacy', label: 'Privacy', icon: 'shield_lock', view: View.PRIVACY },
  ];

  const themes = [
    { id: Theme.DESERT, label: 'Desert', color: '#C67D63', bg: '#F2EEE8' },
    { id: Theme.NIGHT, label: 'Night', color: '#9F86C0', bg: '#141517' },
    { id: Theme.FOREST, label: 'Forest', color: '#4B8F52', bg: '#F1F7EF' },
    { id: Theme.OCEAN, label: 'Ocean', color: '#3D85A5', bg: '#EAF5FA' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-warm-charcoal/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-ceramic-white shadow-2xl z-[70] flex flex-col p-8 pt-20 border-r border-white/50"
          >
            <div className="flex flex-col gap-2 mb-10">
              <span className="text-[10px] uppercase tracking-[0.4em] text-warm-charcoal/30 font-black">Menu</span>
              
              {/* Theme Picker */}
              <div className="mt-5 flex items-center gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`size-8 rounded-full border-2 transition-all flex items-center justify-center p-0.5 ${
                      currentTheme === t.id 
                        ? 'border-terracotta scale-110 shadow-lg' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={t.label}
                  >
                    <div 
                      className="w-full h-full rounded-full transition-colors duration-500" 
                      style={{ backgroundColor: t.color, border: `2px solid ${t.bg}` }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.view) {
                      onNavigate(item.view);
                      onClose();
                    }
                  }}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                    item.disabled 
                    ? 'opacity-20 cursor-not-allowed grayscale' 
                    : 'hover:bg-warm-charcoal/5 active:scale-95 text-warm-charcoal'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl text-terracotta/70">{item.icon}</span>
                  <span className="text-sm font-medium tracking-tight">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8 border-t border-warm-charcoal/5">
              <p className="text-[9px] uppercase tracking-[0.2em] text-warm-charcoal/20 font-bold">Version 1.2.1</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
