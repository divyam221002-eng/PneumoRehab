import React, { useState } from 'react';
import { X, Check, Shield, User, Activity, AlertTriangle } from 'lucide-react';
import { FINGERS } from '../constants/gestures';

export default function PatientProfileModal({
  isOpen,
  onClose,
  activePatient,
  onUpdatePatient,
  currentAngles = [15, 16, 17, 16, 15]
}) {
  const [profile, setProfile] = useState({ ...activePatient });
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [capturedExt, setCapturedExt] = useState(null);
  const [capturedFlex, setCapturedFlex] = useState(null);

  if (!isOpen) return null;

  const handleCaptureExtension = () => {
    const ext = {};
    FINGERS.forEach((f, idx) => {
      ext[f.id] = Math.round(currentAngles[idx] || 15);
    });
    setCapturedExt(ext);
    setCalibrationStep(2);
  };

  const handleCaptureFlexion = () => {
    const flex = {};
    FINGERS.forEach((f, idx) => {
      flex[f.id] = Math.round(currentAngles[idx] || 90);
    });
    setCapturedFlex(flex);
    setCalibrationStep(3);
  };

  const handleApplyCalibration = () => {
    const newThresholds = {};
    FINGERS.forEach((f) => {
      newThresholds[f.id] = {
        min: capturedExt ? capturedExt[f.id] - 3 : f.defaultExt,
        max: capturedFlex ? capturedFlex[f.id] : f.defaultFlex
      };
    });

    const updatedProfile = {
      ...profile,
      thresholds: newThresholds,
      lastCalibrated: new Date().toLocaleDateString()
    };

    onUpdatePatient(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white border border-slate-300 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
              User Profile & Glove Calibration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Condition / Goal
              </label>
              <input
                type="text"
                value={profile.condition}
                onChange={(e) => setProfile({ ...profile, condition: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Hand Being Trained
              </label>
              <select
                value={profile.affectedHand}
                onChange={(e) => setProfile({ ...profile, affectedHand: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600 shadow-2xs"
              >
                <option value="Right">Right Hand</option>
                <option value="Left">Left Hand</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-500 uppercase block mb-1">
                Last Glove Calibration
              </label>
              <div className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono">
                {profile.lastCalibrated || 'Not calibrated yet'}
              </div>
            </div>
          </div>

          {/* 2-Step Safe ROM Calibration Wizard */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-700" />
                Hand Movement Range Setup
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">SAFETY PROTECTED</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Setting your hand's comfortable movement range ensures the glove never bends your fingers further than what feels comfortable.
            </p>

            {calibrationStep === 0 && (
              <button
                onClick={() => setCalibrationStep(1)}
                className="w-full btn-primary-light font-mono font-semibold py-2 rounded-lg text-xs"
              >
                START 2-STEP CALIBRATION
              </button>
            )}

            {calibrationStep === 1 && (
              <div className="space-y-2.5">
                <div className="bg-white border border-slate-300 p-3 rounded-lg text-xs text-slate-700 shadow-2xs">
                  <strong className="font-mono text-sky-700 uppercase">Step 1:</strong> Relax your hand as flat and open as you comfortably can. The glove will record your open hand position.
                </div>
                <button
                  onClick={handleCaptureExtension}
                  className="w-full btn-primary-light font-mono font-semibold py-2 rounded-lg text-xs"
                >
                  RECORD OPEN HAND POSITION
                </button>
              </div>
            )}

            {calibrationStep === 2 && (
              <div className="space-y-2.5">
                <div className="bg-white border border-slate-300 p-3 rounded-lg text-xs text-slate-700 shadow-2xs">
                  <strong className="font-mono text-blue-700 uppercase">Step 2:</strong> Gently close your hand into a comfortable fist. The glove will record your closed hand position.
                </div>
                <button
                  onClick={handleCaptureFlexion}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-mono font-semibold py-2 rounded-lg text-xs transition border border-blue-600 shadow-xs"
                >
                  RECORD CLOSED FIST POSITION
                </button>
              </div>
            )}

            {calibrationStep === 3 && (
              <div className="space-y-2.5">
                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Calibration successfully recorded for all fingers! Ready to save comfortable limits.</span>
                </div>
                <button
                  onClick={handleApplyCalibration}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-semibold py-2 rounded-lg text-xs transition border border-emerald-600 shadow-xs"
                >
                  SAVE COMFORTABLE RANGE LIMITS
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              onUpdatePatient(profile);
              onClose();
            }}
            className="btn-primary-light font-mono px-4 py-1.5 rounded-lg text-xs font-semibold"
          >
            SAVE PROFILE
          </button>
        </div>
      </div>
    </div>
  );
}
