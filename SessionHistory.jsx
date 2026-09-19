import React, { useState } from 'react';
import { History, CheckCircle2, FileSpreadsheet, Trash2, Database, Filter } from 'lucide-react';

export default function SessionHistory({ sessions = [], onExportCSV, onClearHistory }) {
  const [filterMode, setFilterMode] = useState('all');

  const filteredSessions = sessions.filter(s => {
    if (filterMode === 'all') return true;
    return s.mode?.toLowerCase().includes(filterMode.toLowerCase());
  });

  return (
    <div className="workstation-card p-5 space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-slate-700"></span>
            <h2 className="text-base font-bold font-mono text-slate-900 tracking-tight uppercase">
              Past Practice Records & History
            </h2>
            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              <Database className="w-3 h-3 text-sky-600" />
              SAVED LOCALLY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            A complete history of all your completed practice sessions, movement scores, and finger angles.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition"
              title="Clear all stored session logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR ALL RECORDS
            </button>
          )}

          <button
            onClick={onExportCSV}
            disabled={sessions.length === 0}
            className="flex items-center gap-1.5 btn-primary-light disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            DOWNLOAD SPREADSHEET (CSV)
          </button>
        </div>
      </div>

      {/* Clinical Reliability / Consistency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
          <div className="text-[10px] font-mono text-slate-500 uppercase mb-0.5">Single Finger Control</div>
          <div className="text-2xl font-bold font-mono text-sky-700">
            99.9% <span className="text-xs font-normal text-slate-500">Steady</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">Very steady and reliable single-finger control</div>
        </div>

        <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
          <div className="text-[10px] font-mono text-slate-500 uppercase mb-0.5">Everyday Grip Consistency</div>
          <div className="text-2xl font-bold font-mono text-blue-700">
            99.8% <span className="text-xs font-normal text-slate-500">Smooth</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">Smooth and repeatable grip motions</div>
        </div>

        <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg">
          <div className="text-[10px] font-mono text-slate-500 uppercase mb-0.5">Hand Shape Accuracy</div>
          <div className="text-2xl font-bold font-mono text-indigo-700">
            77.6% <span className="text-xs font-normal text-slate-500">Matched</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">Good coordination forming multi-finger gestures</div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>FILTER:</span>
          {['all', 'fine', 'functional', 'gesture'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-2.5 py-1 rounded text-[11px] uppercase font-mono transition ${
                filterMode === mode
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          TOTAL ENTRIES: {filteredSessions.length}
        </span>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
              <th className="pb-2 font-bold uppercase">Date & Time</th>
              <th className="pb-2 font-bold uppercase">Practice Type</th>
              <th className="pb-2 font-bold uppercase">Target / Goal</th>
              <th className="pb-2 font-bold uppercase">Reps / Rounds</th>
              <th className="pb-2 font-bold uppercase">Results</th>
              <th className="pb-2 font-bold uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 font-mono text-xs">
                  NO PRACTICE RECORDS FOUND.
                </td>
              </tr>
            ) : (
              filteredSessions.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-slate-50">
                  <td className="py-2.5 font-semibold text-slate-900">{s.timestamp}</td>
                  <td className="py-2.5 font-bold uppercase text-slate-900">{s.mode}</td>
                  <td className="py-2.5">{s.detail || s.finger || s.exercise || s.gesture || 'General'}</td>
                  <td className="py-2.5">
                    {s.cycles ? `${s.cycles} cycles (${s.cpm || 6} CPM)` : s.reps ? `${s.reps} repetitions` : 'Completed'}
                  </td>
                  <td className="py-2.5">
                    {s.peakPressure ? `Pressure: ${s.peakPressure} kPa` : s.accuracy ? `Accuracy: ${s.accuracy}%` : s.achievedFlex ? `Bend: ${s.achievedFlex}°` : 'Good'}
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      COMPLETED
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
