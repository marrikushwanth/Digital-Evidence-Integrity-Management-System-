import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ShieldAlert } from 'lucide-react';
import SocCard from '../ui/SocCard';

export default function LocationGate({ onComplete }) {
  const [status, setStatus] = useState('pending'); // pending, checking, denied, error

  useEffect(() => {
    // Check if we already have it in session to prevent double-asking
    if (sessionStorage.getItem('location_checked')) {
      onComplete();
    }
  }, [onComplete]);

  const requestLocation = () => {
    setStatus('checking');
    if (!navigator.geolocation) {
      logEvent('UNAVAILABLE', null);
      setStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        logEvent('GRANTED', {
          gps_latitude: position.coords.latitude,
          gps_longitude: position.coords.longitude,
          gps_accuracy: position.coords.accuracy
        });
        sessionStorage.setItem('location_checked', 'true');
        onComplete();
      },
      (error) => {
        console.error('Location error:', error);
        logEvent('DENIED', null);
        setStatus('denied');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const logEvent = async (permission, coords) => {
    try {
      await fetch('http://localhost:5000/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'LOCATION_GATE',
          event_result: permission,
          location_permission: permission,
          ...coords
        })
      });
    } catch (e) {
      console.error('Failed to log security event:', e);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#02050a] flex items-center justify-center p-4">
        <div className="text-soc-cyan font-mono-tabular animate-pulse">Requesting location access...</div>
      </div>
    );
  }

  if (status === 'denied' || status === 'error') {
    return (
      <div className="min-h-screen bg-[#02050a] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <SocCard>
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-mono-tabular font-bold text-red-500">Access Denied</h1>
              <p className="text-sm text-soc-muted font-mono-tabular">
                Location permission is required to access DEIMS. We use this strictly for security monitoring and login auditing.
              </p>
              <button
                onClick={requestLocation}
                className="w-full py-3 bg-red-900/20 border border-red-500 text-red-500 rounded font-mono-tabular font-bold uppercase tracking-widest text-xs hover:bg-red-500 hover:text-black transition-colors"
              >
                Try Again
              </button>
            </div>
          </SocCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02050a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SocCard>
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-soc-cyan/10 border border-soc-cyan/30 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-soc-cyan" />
              </div>
              <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest">Security Gate</h1>
              <div className="bg-[#0a1122] p-4 rounded border border-soc-panel-border text-left">
                <p className="text-sm text-soc-muted font-mono-tabular mb-2">
                  Location access is required to access DEIMS.
                </p>
                <p className="text-xs text-soc-muted font-mono-tabular">
                  DEIMS uses your location for security monitoring and login auditing. Your location will be recorded when you access the system.
                </p>
              </div>
              <button
                onClick={requestLocation}
                className="w-full py-3 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan rounded font-mono-tabular font-bold uppercase tracking-widest text-xs hover:bg-soc-cyan hover:text-black transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                Allow Location
              </button>
            </div>
          </SocCard>
        </motion.div>
      </div>
    </div>
  );
}
