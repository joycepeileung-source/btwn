
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreathingCircleProps {
  isListening: boolean;
  onClick: () => void;
}

const BreathingCircle: React.FC<BreathingCircleProps> = ({ isListening, onClick }) => {
  return (
    <div className="relative flex items-center justify-center shrink-0 w-80 h-80 sm:w-96 sm:h-96">
      {/* Background Breathing Glow */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.25, 0.1]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 rounded-full bg-white blur-[110px]"
          />
        )}
      </AnimatePresence>

      {/* The Layered Orb Container with visible "Deep Breathing" Animation */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        animate={{ 
          scale: isListening ? [1, 1.14, 1] : [1, 1.08, 1],
          y: isListening ? [0, -10, 0] : [0, -6, 0],
          boxShadow: isListening 
            ? ["0 20px 50px rgba(198, 125, 99, 0.1)", "0 40px 80px rgba(198, 125, 99, 0.2)", "0 20px 50px rgba(198, 125, 99, 0.1)"]
            : ["0 10px 30px rgba(92, 84, 78, 0.05)", "0 25px 50px rgba(92, 84, 78, 0.1)", "0 10px 30px rgba(92, 84, 78, 0.05)"]
        }}
        transition={{
          duration: isListening ? 5 : 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 w-full h-full flex items-center justify-center group outline-none focus:outline-none bg-transparent border-none p-0 appearance-none rounded-full"
      >
        {/* Organic Diffused Blobs */}
        <motion.div 
          animate={isListening ? {
            scale: [0.9, 1.15, 0.85, 0.9],
            rotate: [0, 90, 180, 360],
            borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "58% 42% 35% 65% / 51% 54% 46% 49%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
          } : { 
            scale: [0.75, 0.9, 0.75],
            rotate: [0, 30, 0],
            borderRadius: "50%" 
          }}
          transition={isListening ? { duration: 12, repeat: Infinity, ease: "linear" } : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute w-full h-full waveform-blob transition-all duration-2000 ${isListening ? 'opacity-30' : 'opacity-10'}`} 
        />
        <motion.div 
          animate={isListening ? {
            scale: [1, 0.85, 1.1, 1],
            rotate: [360, 270, 90, 0],
            borderRadius: ["58% 42% 35% 65% / 51% 54% 46% 49%", "42% 58% 70% 30% / 45% 45% 55% 55%", "58% 42% 35% 65% / 51% 54% 46% 49%"]
          } : { 
            scale: [0.8, 0.95, 0.8],
            rotate: [0, -30, 0],
            borderRadius: "50%" 
          }}
          transition={isListening ? { duration: 10, repeat: Infinity, ease: "linear" } : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute w-4/5 h-4/5 waveform-inner transition-all duration-2000 ${isListening ? 'opacity-45' : 'opacity-15'}`} 
        />

        {/* Status Text Overlay - Consistent and elegant font-normal weight */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={false}
            animate={{
              opacity: isListening ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4],
              scale: [1, 1.04, 1]
            }}
            transition={{
              duration: isListening ? 5 : 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex flex-col items-center justify-center"
          >
            <span className="text-[12px] uppercase tracking-[0.6em] text-warm-charcoal/60 font-normal select-none">
              {isListening ? 'Listening' : 'Start'}
            </span>
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
};

export default BreathingCircle;
