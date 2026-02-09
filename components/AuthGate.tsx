
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthGateProps {
  onAuthenticated: () => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [authType, setAuthType] = useState<'PASSCODE' | 'BIOMETRIC'>('PASSCODE');
  
  const savedPasscode = localStorage.getItem('aether_passcode');
  const biometricEnabled = localStorage.getItem('aether_biometric_enabled') === 'true';

  useEffect(() => {
    if (biometricEnabled) {
      setAuthType('BIOMETRIC');
      handleBiometricAuth();
    }
  }, [biometricEnabled]);

  const handleBiometricAuth = async () => {
    if (window.PublicKeyCredential) {
      try {
        // In a real production app, you'd use navigator.credentials.get()
        // Here we simulate the successful native biometric prompt
        // as WebAuthn requires complex server-side challenge-response.
        console.debug("Attempting biometric auth...");
        // Simulation delay for "scanning"
        setTimeout(() => {
          onAuthenticated();
        }, 1500);
      } catch (err) {
        console.error("Biometric failed", err);
        setAuthType('PASSCODE');
      }
    } else {
      setAuthType('PASSCODE');
    }
  };

  const handleKeyClick = (num: string) => {
    if (passcode.length < 4) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);
      if (newPasscode.length === 4) {
        if (newPasscode === savedPasscode) {
          onAuthenticated();
        } else {
          setError(true);
          setTimeout(() => {
            setPasscode('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-bg-page flex flex-col items-center justify-center px-8"
    >
      <div className="fixed inset-0 grain-overlay z-0" />
      
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center">
          <div className="size-16 rounded-3xl bg-ceramic-white shadow-xl flex items-center justify-center mb-6 border border-white">
            <span className="material-symbols-outlined text-terracotta text-3xl">
              {authType === 'BIOMETRIC' ? 'faceid' : 'lock_open'}
            </span>
          </div>
          <h2 className="text-[18px] font-bold text-warm-charcoal tracking-tight font-display">
            {authType === 'BIOMETRIC' ? 'Scanning Face ID' : 'Enter Passcode'}
          </h2>
          <p className="text-[12px] text-warm-charcoal/40 mt-1 uppercase tracking-[0.2em] font-black">
            {authType === 'BIOMETRIC' ? 'Accessing Aether' : 'Security Required'}
          </p>
        </div>

        {authType === 'PASSCODE' ? (
          <>
            <div className="flex gap-4 mb-16">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  className={`size-3 rounded-full border-2 transition-all duration-300 ${
                    passcode.length > i 
                      ? 'bg-terracotta border-terracotta scale-110 shadow-lg shadow-terracotta/20' 
                      : 'border-warm-charcoal/10'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-x-8 gap-y-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyClick(num)}
                  className="size-16 rounded-full bg-white/40 border border-white flex items-center justify-center text-xl font-medium text-warm-charcoal hover:bg-white active:scale-90 transition-all ceramic-button"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleKeyClick('0')}
                className="size-16 rounded-full bg-white/40 border border-white flex items-center justify-center text-xl font-medium text-warm-charcoal hover:bg-white active:scale-90 transition-all ceramic-button"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="size-16 rounded-full flex items-center justify-center text-warm-charcoal/30 hover:text-warm-charcoal transition-colors"
              >
                <span className="material-symbols-outlined">backspace</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-10">
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-[-40px] bg-terracotta/20 blur-3xl rounded-full"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="size-32 rounded-full border-[3px] border-dashed border-terracotta/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-terracotta text-5xl animate-pulse">face</span>
              </div>
            </div>
            
            <button 
              onClick={() => setAuthType('PASSCODE')}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-warm-charcoal/30 hover:text-warm-charcoal/60 transition-colors"
            >
              Use Passcode instead
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AuthGate;
