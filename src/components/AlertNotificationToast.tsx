'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function AlertNotificationToast() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default' && !localStorage.getItem('nexus_alerts_dismissed')) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('nexus_alerts_dismissed', 'true');
    setShow(false);
  };

  const handleRequestPermission = () => {
    if (!('Notification' in window)) return;

    Notification.requestPermission().then(async (permission) => {
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('Nexus News Alerts Active 🚀', {
            body: 'Aapko live breaking news aur editorial updates milte rahenge.',
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200]
          } as any);
        } else {
          new Notification('Nexus News Alerts Active 🚀', {
            body: 'Aapko live breaking news aur editorial updates milte rahenge.',
            icon: '/icon.svg'
          });
        }
      }
      handleDismiss();
    });
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-300">
      <div className="bg-[#1A1A1A] border border-neutral-700 rounded-lg shadow-xl p-4 max-w-sm w-full text-white flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 p-2 rounded-full">
              <Bell className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Stay Updated</h4>
              <p className="text-xs text-neutral-400 mt-1">Get real-time breaking news alerts instantly.</p>
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
            Later
          </button>
          <button
            onClick={handleRequestPermission}
            className="text-xs px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
          >
            Turn On Alerts
          </button>
        </div>
      </div>
    </div>
  );
}
