import React, { useState, useEffect } from 'react';
import { GESTURES, FINGERS, SAFETY_CONFIG } from '../../constants/gestures';
import { hardwareService } from '../../services/hardwareService';
import { Play, Pause, Award, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function GestureTraining({ angles = [15, 16, 17, 16, 15], onSessionComplete }) {
  const [selectedGestureId, setSelectedGestureId] = useState('ok');
  const [isGuiding, setIsGuiding] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);

  const currentGesture = GESTURES.find(g => g.id === selectedGestureId) || GESTURES[0];

  useEffect(() => {
    const fingerKeys = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    let totalDev = 0;

    fingerKeys.forEach((key, idx) => {
      const actual = angles[idx] || 15;
      const target = currentGesture.targets[key] || 15;
      totalDev += Math.abs(actual - target);
    });

    const avgDev = totalDev / 5;
    const score = Math.max(0, Math.min(100, Math.round(100 - (avgDev / 40) * 100)));
    setSimilarityScore(score);
  }, [angles, currentGesture]);

  useEffect(() => {
    if (isGuiding) {
      hardwareService.setFingerTargets(currentGesture.targets);
    }
  }, [isGuiding, currentGesture]);

  const handleSelectGesture = (gesture) => {
    setSelectedGestureId(gesture.id);
    if (isGuiding) {
      hardwareService.setFingerTargets(gesture.targets);
    }
  };

  const toggleGuidance = () => {
    const nextState = !isGuiding;
    setIsGuiding(nextState);
    if (nextState) {
      hardwareService.resetEmergencyStop();
      hardwareService.togglePressureRelief(false);
      hardwareService.setFingerTargets(currentGesture.targets);
    } else {
      hardwareService.togglePressureRelief(true);
      setTimeout(() => hardwareService.togglePressureRelief(false), 400);
    }
  };

  return (
    <div className="workstation-card p-5 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-indigo-600 shadow-2xs"></span>
            <h2 className="text-base font-bold font-mono text-slate-900 tracking-tight uppercase">
              13 Common Hand Shapes & Gestures
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Practice matching these 13 everyday hand shapes. The glove will guide your fingers into place.
          </p>
        </div>

        {/* Guidance Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleGuidance}
            className={`flex items-center gap-1.5 font-mono text-xs font-semibold px-4 py-2 rounded-lg transition ${
              isGuiding
                ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-500 shadow-xs'
                : 'btn-primary-light'
            }`}
          >
            {isGuiding ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isGuiding ? 'STOP HELPING' : 'HELP HAND FORM THIS SHAPE'}
          </button>
        </div>
      </div>

      {/* 13-Pattern Selector Grid */}
      <div>
        <label className="text-[11px] font-mono font-bold text-slate-500 uppercase block mb-1.5">
          Choose a hand shape to practice (1–13):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {GESTURES.map((gesture, idx) => {
            const isSelected = gesture.id === selectedGestureId;
            const patNum = (idx + 1).toString().padStart(2, '0');
            return (
              <button
                key={gesture.id}
                onClick={() => handleSelectGesture(gesture)}
                className={`p-2.5 rounded-lg border text-left transition select-none ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-1 ring-slate-900/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>#{patNum}</span>
                  {isSelected && <span className="led-indicator led-green"></span>}
                </div>
                <div className="text-xs font-bold truncate mt-1">
                  {gesture.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Pattern Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Target Angle Breakdown Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <span className="text-xs font-mono font-bold text-slate-800 uppercase">
                Shape: {currentGesture.name}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentGesture.description}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-medium">
              {currentGesture.category}
            </span>
          </div>

          {/* Joint-by-Joint Deviation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                  <th className="pb-2 font-bold uppercase">Finger</th>
                  <th className="pb-2 font-bold uppercase">Goal</th>
                  <th className="pb-2 font-bold uppercase">Your Hand</th>
                  <th className="pb-2 font-bold uppercase">Difference</th>
                  <th className="pb-2 font-bold uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {FINGERS.map((finger, idx) => {
                  const actual = angles[idx] || 15;
                  const target = currentGesture.targets[finger.id] || 15;
                  const delta = Math.abs(actual - target);
                  const isMatch = delta <= SAFETY_CONFIG.maxAllowedError;

                  return (
                    <tr key={finger.id} className="hover:bg-white/80">
                      <td className="py-2.5 font-bold text-slate-900">
                        {finger.name.toUpperCase()}
                      </td>
                      <td className="py-2.5 font-semibold text-indigo-700">{target}°</td>
                      <td className="py-2.5 font-semibold text-slate-900">{actual.toFixed(1)}°</td>
                      <td className="py-2.5">
                        <span className={isMatch ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          ±{delta.toFixed(1)}°
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isMatch ? 'MATCHED' : 'TRY AGAIN'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Real-time Shape Match Gauge (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                Shape Match Score
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isGuiding ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isGuiding ? 'GLOVE HELP: ON' : 'GLOVE HELP: OFF'}
              </span>
            </div>

            {/* Match Accuracy Readout */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-3 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                How Well Your Hand Matches
              </span>
              <div className="text-4xl font-mono font-bold tracking-tight text-white my-1">
                {similarityScore}%
              </div>
              <div className="w-full bg-slate-800 h-2 rounded overflow-hidden p-0.5 border border-slate-700 mt-2">
                <div
                  className={`h-full rounded-xs transition-all duration-150 ${
                    similarityScore > 80 ? 'bg-emerald-400' : similarityScore > 60 ? 'bg-amber-400' : 'bg-indigo-400'
                  }`}
                  style={{ width: `${similarityScore}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span>CLINICAL BENCHMARK:</span>
                <span className="text-slate-200">ICC = 0.7763</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>TOLERANCE ENVELOPE:</span>
                <span className="text-slate-200">±{SAFETY_CONFIG.maxAllowedError}° (ISO/IEC)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>FUGL-MEYER MOTOR ASSESSMENT</span>
            <span>PATTERN RECOVERY PROTOCOL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
