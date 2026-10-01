'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallAppPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    if (localStorage.getItem('nexus_pwa_dismissed')) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('nexus_pwa_dismissed', 'true');
    setShow(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 transition-opacity duration-300">
      <div className="bg-[#1A1A1A] border border-neutral-700 rounded-lg shadow-xl p-4 max-w-sm w-full text-white flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 p-2 rounded-full">
              <Download className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Install Nexus News</h4>
              <p className="text-xs text-neutral-400 mt-1">Get instant access right from your home screen.</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-neutral-500 hover:text-white transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={handleDismiss}
            className="text-xs px-3 py-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="text-xs px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
