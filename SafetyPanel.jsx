import React from 'react';
import { FINGERS, SAFETY_CONFIG } from '../constants/gestures';
import { hardwareService } from '../services/hardwareService';
import { Shield, ShieldAlert, Wind, AlertOctagon, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SafetyPanel({
  safetyThresholds = {},
  onUpdateThresholds,
  reliefActive = false,
  emergencyStop = false,
  safetyAlert = null,
  onClearAlert
}) {
  const handleThresholdChange = (fingerId, type, val) => {
    const updated = {
      ...safetyThresholds,
      [fingerId]: {
        ...safetyThresholds[fingerId],
        [type]: Number(val)
      }
    };
    onUpdateThresholds(updated);
    hardwareService.setSafetyThresholds(updated);
  };

  const handleToggleRelief = () => {
    hardwareService.togglePressureRelief();
  };

  const handleEStop = () => {
    if (emergencyStop) {
      hardwareService.resetEmergencyStop();
    } else {
      hardwareService.emergencyStop();
    }
  };

  return (
    <div className="workstation-card p-5 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-amber-600 shadow-2xs"></span>
            <h2 className="text-base font-bold font-mono text-slate-900 tracking-tight uppercase">
              Safety Limits & Air Pressure Protection
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic protection ensures your fingers never bend or straighten beyond safe, comfortable angles.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRelief}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition ${
              reliefActive
                ? 'bg-amber-100 border-amber-400 text-amber-900 animate-pulse shadow-xs'
                : 'btn-tactile-light text-slate-700'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-amber-600" />
            <span>AIR RELEASE: {reliefActive ? 'OPEN (RELEASING)' : 'CLOSED (HOLDING)'}</span>
          </button>

          <button
            onClick={handleEStop}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition ${
              emergencyStop
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 animate-pulse shadow-md'
                : 'btn-estop-bright text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{emergencyStop ? 'RESET STOP' : 'EMERGENCY STOP'}</span>
          </button>
        </div>
      </div>

      {/* Safety Alert Banner */}
      {safetyAlert && (
        <div className="p-3.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold font-mono uppercase text-rose-900">{safetyAlert.message}</div>
              <div className="text-[11px] text-rose-700 mt-0.5">
                Air was automatically released to protect your fingers from bending or stretching too far.
              </div>
            </div>
          </div>
          <button
            onClick={onClearAlert}
            className="text-[11px] font-mono font-semibold bg-white border border-rose-300 px-2.5 py-1 rounded text-rose-800 hover:bg-rose-100 transition"
          >
            OK / DISMISS
          </button>
        </div>
      )}

      {/* Threshold Limit Configuration Deck */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {FINGERS.map((f, idx) => {
          const limits = safetyThresholds[f.id] || { min: 12, max: 92 };
          return (
            <div key={f.id} className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                <span className="text-xs font-bold font-mono uppercase text-slate-900">
                  CH-{idx + 1} {f.name}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>

              <div className="space-y-3 text-xs">
                {/* Min Extension */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span>MAX OPEN (FLAT):</span>
                    <strong className="text-teal-700">{limits.min}°</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={limits.min}
                    onChange={(e) => handleThresholdChange(f.id, 'min', e.target.value)}
                    className="w-full calibrated-slider-light"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                    <span>10°</span>
                    <span>30°</span>
                  </div>
                </div>

                {/* Max Flexion */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span>MAX BEND (CURL):</span>
                    <strong className="text-sky-700">{limits.max}°</strong>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={limits.max}
                    onChange={(e) => handleThresholdChange(f.id, 'max', e.target.value)}
                    className="w-full calibrated-slider-light"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                    <span>70°</span>
                    <span>100° MAX</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regulatory & Safety Diagnostic Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span>SAFETY ACCURACY: </span>
          <strong className="text-slate-800">Movements monitored within a safe, comfortable range</strong>
        </div>
        <div>
          <span>MAX AIR PRESSURE LIMIT: </span>
          <strong className="text-amber-800">{SAFETY_CONFIG.maxPressureLimitKPa} kPa (Auto-releases if exceeded)</strong>
        </div>
      </div>
    </div>
  );
}
