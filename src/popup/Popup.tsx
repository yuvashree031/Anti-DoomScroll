import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { ExtensionSettings, SensitivityMode, StatisticsData } from '../types';

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>({
    filterEnabled: true,
    sensitivityMode: 'study_only',
    blockShortsAndReels: true,
    blurOnly: true,
    sensitivityThreshold: 0.45,
  });

  const [stats, setStats] = useState<StatisticsData>({
    blockedToday: 0,
    blockedTotal: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadInitialState();

    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local') {
        if (changes.anti_doomscroll_settings) {
          setSettings(changes.anti_doomscroll_settings.newValue);
        }
        if (changes.anti_doomscroll_stats) {
          setStats(changes.anti_doomscroll_stats.newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const loadInitialState = async () => {
    try {
      const currentSettings = await StorageService.getSettings();
      const currentStats = await StorageService.getStatistics();
      setSettings(currentSettings);
      setStats(currentStats);
    } catch (error) {
      console.error('[Popup] Failed to load extension state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (patch: Partial<ExtensionSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await StorageService.updateSettings(patch);
  };

  const modeLabels: Record<SensitivityMode, string> = {
    study_only: 'Study Only',
    balanced: 'Balanced',
    strict: 'Strict',
    aggressive: 'Aggressive',
  };

  return (
    <div className="w-[360px] bg-slate-950 text-slate-100 p-5 font-sans border border-slate-800 shadow-2xl flex flex-col gap-4">
      {/* Header */}
      <header className="flex items-start justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-start gap-2.5">
          <img
            src="/anti.png"
            alt="Anti-DoomScroll Logo"
            className="w-8 h-8 rounded-lg object-contain border border-slate-700/60 shadow-sm mt-0.5"
          />
          <div>
            <h1 className="text-sm font-bold tracking-wide text-teal-400">
              Anti-DoomScroll
            </h1>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
              Don't let the algorithm cook.<br />
              <span className="text-slate-400">Zero rage-bait, just immaculate screen time.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`w-2 h-2 rounded-full ${
              settings.filterEnabled
                ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {settings.filterEnabled ? 'Active' : 'Paused'}
          </span>
        </div>
      </header>

      {/* Control Switches */}
      <section className="flex flex-col gap-2.5">
        {/* Master AI Filter Toggle */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">AI Feed Redaction</div>
            <div className="text-[11px] text-slate-400">Redact non-study distractions & clickbait</div>
          </div>
          <button
            onClick={() => handleUpdate({ filterEnabled: !settings.filterEnabled })}
            disabled={loading}
            aria-label="Toggle feed purification"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.filterEnabled ? 'bg-teal-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.filterEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Block Shorts & Reels Toggle */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Block Shorts & Reels</div>
            <div className="text-[11px] text-slate-400">Eliminate doomscroll feeds and reels</div>
          </div>
          <button
            onClick={() => handleUpdate({ blockShortsAndReels: !settings.blockShortsAndReels })}
            disabled={loading}
            aria-label="Toggle shorts and reels block"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.blockShortsAndReels ? 'bg-teal-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.blockShortsAndReels ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Sensitivity Selector */}
      <section className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Feed Mode</span>
          <span className="text-[10px] text-teal-400 font-mono">
            {modeLabels[settings.sensitivityMode]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80">
          {(['study_only', 'balanced', 'strict'] as SensitivityMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleUpdate({ sensitivityMode: mode })}
              className={`py-1.5 px-1.5 text-[11px] font-medium rounded-md transition-all text-center ${
                settings.sensitivityMode === mode
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
          {settings.sensitivityMode === 'study_only' &&
            'Study Only (Recommended): Only shows tutorials, engineering, study, and educational videos. Redacts music videos, trailers, gossip, and vlogs.'}
          {settings.sensitivityMode === 'balanced' &&
            'Balanced: Shows general videos but redacts sensational clickbait, hype, and rage-bait.'}
          {settings.sensitivityMode === 'strict' &&
            'Strict: Redacts clickbait plus viral comedy challenges, pranks, and low-value entertainment.'}
        </p>
      </section>

      {/* Statistics Counter */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Blocked Today
          </span>
          <div className="mt-1 text-2xl font-bold tracking-tight text-teal-400">
            {loading ? '...' : stats.blockedToday}
          </div>
          <span className="text-[10px] text-slate-500">Distractions neutralized</span>
        </div>

        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Blocked
          </span>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-200">
            {loading ? '...' : stats.blockedTotal}
          </div>
          <span className="text-[10px] text-slate-500">Lifetime saves</span>
        </div>
      </section>

      {/* Monitored Feeds */}
      <section className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Protected Feeds
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="px-2 py-1.5 bg-slate-800/60 rounded border border-slate-700/50 text-slate-300 font-medium">
            YouTube
          </div>
          <div className="px-2 py-1.5 bg-slate-800/60 rounded border border-slate-700/50 text-slate-300 font-medium">
            Instagram
          </div>
          <div className="px-2 py-1.5 bg-slate-800/60 rounded border border-slate-700/50 text-slate-300 font-medium">
            Twitter / X
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-1 border-t border-slate-800/60 text-center flex flex-col gap-0.5">
        <div className="text-[10px] text-slate-500 font-mono">
          Edge Model: DistilBERT-MNLI (Quantized)
        </div>
        <div className="text-[9px] text-slate-600">
          Zero-Shot Classification via WebAssembly
        </div>
      </footer>
    </div>
  );
};
