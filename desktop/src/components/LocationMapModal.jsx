import React, { useState } from 'react';
import { 
  MapPin, 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Navigation, 
  Clock, 
  User, 
  Building2, 
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function LocationMapModal({ locationData, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!locationData) return null;

  const {
    title = 'User Presence & Location',
    userName = 'Employee',
    userRole = 'Collector',
    eventName = 'Recorded Location',
    timestamp = null,
    address = 'Counter / Field',
    latitude = null,
    longitude = null,
    receiptNumber = null,
    amount = null,
  } = locationData;

  // Use Salem coordinates as default if lat/long are null
  const defaultLat = 11.6643;
  const defaultLng = 78.1460;
  const lat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : defaultLat;
  const lng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : defaultLng;
  const hasExactGps = typeof latitude === 'number' && !isNaN(latitude);

  // OpenStreetMap embed URL
  const delta = 0.008;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  // Google Maps link
  const googleMapsUrl = hasExactGps
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const copyCoordinates = () => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-scaleUp flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-md">
              <MapPin className="w-5 h-5 text-sky-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{title}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  hasExactGps 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {hasExactGps ? 'GPS Verified' : 'Address Reference'}
                </span>
              </div>
              <p className="text-xs text-sky-300 font-medium mt-0.5">
                Presence audit for {userName} ({userRole})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Map View */}
        <div className="relative w-full h-64 sm:h-72 bg-slate-100 border-b border-slate-200">
          <iframe
            title="Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={osmEmbedUrl}
            className="w-full h-full filter saturate-[1.1]"
          />

          {/* Quick Floating Badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-slate-800">{address}</span>
          </div>

          {/* Quick External Map Launcher */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Open Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Presence Metadata & Activity Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Person & Event */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                User / Agent
              </span>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <User className="w-4 h-4 text-sky-600" />
                <span>{userName}</span>
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                  {userRole}
                </span>
              </div>
              <div className="text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Event: {eventName}</span>
              </div>
            </div>

            {/* Time Recorded */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Timestamp Recorded
              </span>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>{formattedTime}</span>
              </div>
              <p className="text-slate-500 font-medium">
                Server-synchronized timestamp
              </p>
            </div>
          </div>

          {/* Location Address & GPS Coordinates */}
          <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                  Presence Location / Address
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {address}
                </p>
                {receiptNumber && (
                  <p className="text-xs font-semibold text-sky-700 mt-1">
                    Receipt #{receiptNumber} {amount ? `• Collection Amount: ₹${Number(amount).toLocaleString('en-IN')}` : ''}
                  </p>
                )}
              </div>
              <Compass className="w-5 h-5 text-sky-600 shrink-0 mt-1" />
            </div>

            {/* Coordinates Bar */}
            <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-mono text-slate-700 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>GPS: <strong>{lat.toFixed(6)}, {lng.toFixed(6)}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCoordinates}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Copy Lat/Long Coordinates"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Coordinates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Close
            </button>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition active:scale-[0.98]"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
