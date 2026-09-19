import React, { useState, useEffect, useRef } from 'react';
import { FINGERS, SAFETY_CONFIG } from '../../constants/gestures';
import { hardwareService } from '../../services/hardwareService';
import { Play, Pause, RotateCcw, Target, CheckCircle2, AlertTriangle, ChevronRight, Activity } from 'lucide-react';

export default function FineTraining({ currentAngles = [15, 16, 17, 16, 15], onSessionComplete }) {
  const [selectedFingerId, setSelectedFingerId] = useState('index');
  const [targetCycles, setTargetCycles] = useState(10);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [frequencyCPM, setFrequencyCPM] = useState(SAFETY_CONFIG.defaultCycleCPM); // 6 CPM
  const [targetFlexion, setTargetFlexion] = useState(90);
  const [targetExtension, setTargetExtension] = useState(16);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('STANDBY');
  const [cycleProgress, setCycleProgress] = useState(0);
  const [targetError, setTargetError] = useState(0);

  const selectedFingerIndex = FINGERS.findIndex(f => f.id === selectedFingerId);
  const currentAngle = currentAngles[selectedFingerIndex] || 15;

  const cycleTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  const cycleDurationMs = (60 / frequencyCPM) * 1000;

  useEffect(() => {
    if (!isActive) {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      setCurrentPhase('STANDBY');
      return;
    }

    startTimeRef.current = Date.now();
    const interval = 50;

    cycleTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const cycleElapsed = elapsed % cycleDurationMs;
      const progress = (cycleElapsed / cycleDurationMs) * 100;
      setCycleProgress(progress);

      const t = cycleElapsed / cycleDurationMs;
      let targetA = targetExtension;

      if (t < 0.35) {
        setCurrentPhase('FLEXION RAMP');
        const phaseT = t / 0.35;
        targetA = targetExtension + (targetFlexion - targetExtension) * phaseT;
      } else if (t < 0.50) {
        setCurrentPhase('SUSTAINED FLEXION HOLD');
        targetA = targetFlexion;
      } else if (t < 0.85) {
        setCurrentPhase('EXTENSION RETURN');
        const phaseT = (t - 0.50) / 0.35;
        targetA = targetFlexion - (targetFlexion - targetExtension) * phaseT;
      } else {
        setCurrentPhase('REST INTERVAL');
        targetA = targetExtension;
      }

      hardwareService.setFingerTargets({
        [selectedFingerId]: Math.round(targetA)
      });

      const err = Math.abs(currentAngle - targetA);
      setTargetError(Number(err.toFixed(2)));

      const currentCycleCount = Math.floor(elapsed / cycleDurationMs);
      if (currentCycleCount !== completedCycles) {
        setCompletedCycles(currentCycleCount);
        if (currentCycleCount >= targetCycles) {
          setIsActive(false);
          clearInterval(cycleTimerRef.current);
          if (onSessionComplete) {
            onSessionComplete({
              mode: 'Fine Training',
              finger: selectedFingerId.toUpperCase(),
              cycles: targetCycles,
              cpm: frequencyCPM,
              achievedFlex: targetFlexion,
              timestamp: new Date().toLocaleTimeString()
            });
          }
        }
      }
    }, interval);

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [isActive, selectedFingerId, frequencyCPM, targetFlexion, targetExtension, targetCycles, completedCycles]);

  const handleStart = () => {
    hardwareService.resetEmergencyStop();
    hardwareService.togglePressureRelief(false);
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
    hardwareService.togglePressureRelief(true);
    setTimeout(() => hardwareService.togglePressureRelief(false), 500);
  };

  const handleReset = () => {
    setIsActive(false);
    setCompletedCycles(0);
    setCycleProgress(0);
    hardwareService.setFingerTargets({ [selectedFingerId]: targetExtension });
  };

  const isErrorSafe = targetError <= SAFETY_CONFIG.maxAllowedError;

  return (
    <div className="workstation-card p-5 space-y-5 select-none">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-sky-600 shadow-2xs"></span>
            <h2 className="text-base font-bold font-mono text-slate-900 tracking-tight uppercase">
              Single Finger Practice
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pick one finger to practice bending and stretching with gentle air-powered assistance.
          </p>
        </div>

        {/* Primary Action Controls */}
        <div className="flex items-center gap-2">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 btn-primary-light font-mono text-xs font-semibold px-4 py-2 rounded-lg"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START PRACTICE
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-semibold px-4 py-2 rounded-lg border border-amber-500 shadow-xs"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              PAUSE & RELEASE AIR
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 btn-tactile-light font-mono text-xs font-semibold px-3 py-2 rounded-lg"
            title="Start repetitions over"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            START OVER
          </button>
        </div>
      </div>

      {/* Channel / Digit Selection Bar */}
      <div>
        <label className="text-[11px] font-mono font-bold text-slate-500 uppercase block mb-1.5">
          Choose which finger to practice:
        </label>
        <div className="grid grid-cols-5 gap-2.5">
          {FINGERS.map((finger, idx) => {
            const isSelected = finger.id === selectedFingerId;
            const channelId = `CH-${idx + 1}`;
            return (
              <button
                key={finger.id}
                onClick={() => {
                  if (!isActive) setSelectedFingerId(finger.id);
                }}
                disabled={isActive}
                className={`p-3 rounded-lg border text-left transition select-none ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-1 ring-slate-900/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 disabled:opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                    {channelId}
                  </span>
                  {isSelected && <span className="led-indicator led-green"></span>}
                </div>
                <div className="text-xs font-bold uppercase mt-1">
                  {finger.name}
                </div>
                <div className={`text-[10px] font-mono mt-0.5 font-semibold ${isSelected ? 'text-sky-300' : 'text-sky-700'}`}>
                  {currentAngles[idx]?.toFixed(1) || 15}°
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Protocol Configuration & Real-Time Tracking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Parameter Dials & Limits (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center justify-between border-b border-slate-200 pb-2">
            <span>Exercise Settings</span>
            <span className="text-[10px] font-normal text-slate-500">Gentle & Safe Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Target Flexion */}
            <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">How Far to Bend (Goal)</span>
              <div className="text-2xl font-bold font-mono text-sky-700 my-1">
                {targetFlexion}°
              </div>
              <input
                type="range"
                min="60"
                max="98"
                step="1"
                disabled={isActive}
                value={targetFlexion}
                onChange={(e) => setTargetFlexion(Number(e.target.value))}
                className="w-full calibrated-slider-light"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>60°</span>
                <span>98° MAX</span>
              </div>
            </div>

            {/* Target Extension */}
            <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Resting Open Angle</span>
              <div className="text-2xl font-bold font-mono text-teal-700 my-1">
                {targetExtension}°
              </div>
              <input
                type="range"
                min="12"
                max="30"
                step="1"
                disabled={isActive}
                value={targetExtension}
                onChange={(e) => setTargetExtension(Number(e.target.value))}
                className="w-full calibrated-slider-light"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>12° MIN</span>
                <span>30°</span>
              </div>
            </div>

            {/* Cadence CPM */}
            <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-2xs">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Speed</span>
              <div className="text-2xl font-bold font-mono text-indigo-700 my-1">
                {frequencyCPM} <span className="text-xs font-normal text-slate-500">times/min</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                disabled={isActive}
                value={frequencyCPM}
                onChange={(e) => setFrequencyCPM(Number(e.target.value))}
                className="w-full calibrated-slider-light"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>Slow (2)</span>
                <span>Faster (12)</span>
              </div>
            </div>
          </div>

          {/* Cycle Target Stepper */}
          <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg p-3 text-xs shadow-2xs">
            <span className="font-mono text-slate-700">REPETITIONS GOAL:</span>
            <div className="flex items-center gap-2">
              <button
                disabled={isActive || targetCycles <= 5}
                onClick={() => setTargetCycles(prev => Math.max(5, prev - 5))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-mono font-bold text-slate-700 disabled:opacity-40 btn-tactile-light"
              >
                -
              </button>
              <span className="font-mono font-bold text-sm w-20 text-center text-slate-900">
                {targetCycles} times
              </span>
              <button
                disabled={isActive || targetCycles >= 50}
                onClick={() => setTargetCycles(prev => Math.min(50, prev + 5))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-mono font-bold text-slate-700 disabled:opacity-40 btn-tactile-light"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-time Status & Phase Monitor (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase">
                Practice Status
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isActive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isActive ? 'EXERCISING' : 'READY'}
              </span>
            </div>

            {/* Current Phase Readout */}
            <div className="mb-4">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Current Step</span>
              <div className="text-sm font-mono font-bold text-white tracking-wide mt-1 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-sky-400 animate-ping' : 'bg-slate-600'}`}></span>
                {currentPhase === 'STANDBY' ? 'READY TO START' :
                 currentPhase === 'FLEXION RAMP' ? 'GENTLY BENDING' :
                 currentPhase === 'SUSTAINED FLEXION HOLD' ? 'HOLDING BEND' :
                 currentPhase === 'EXTENSION RETURN' ? 'OPENING FINGER' : 'RESTING'}
              </div>
            </div>

            {/* Error Gauge Delta */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 mb-3">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                <span>MOVEMENT ACCURACY (DIFFERENCE FROM GOAL)</span>
                <span className={isErrorSafe ? 'text-emerald-400' : 'text-rose-400'}>
                  LIMIT: ±{SAFETY_CONFIG.maxAllowedError}°
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-bold text-white">
                  ±{targetError.toFixed(1)}°
                </div>
                <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isErrorSafe ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {isErrorSafe ? 'GREAT ACCURACY' : 'ASSISTING'}
                </div>
              </div>
            </div>

            {/* Completed Cycles Progress */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>REPETITIONS COMPLETED</span>
                <span className="text-slate-200 font-semibold">{completedCycles} / {targetCycles}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-sky-400 h-full rounded-xs transition-all duration-200"
                  style={{ width: `${(completedCycles / targetCycles) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>STUDY CONSISTENCY: ICC = 0.9996</span>
            <span>SD &lt; 3.0°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
