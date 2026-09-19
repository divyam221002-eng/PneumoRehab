import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { hardwareService } from '../services/hardwareService';
import { FINGERS } from '../constants/gestures';
import {
  CheckCircle2,
  AlertTriangle,
  Camera,
  Play,
  Wind,
  Award,
  Sparkles
} from 'lucide-react';

export default function HandOpeningTracker({
  currentAngles = [15, 16, 17, 16, 15],
  onSessionComplete
}) {
  const [assessments, setAssessments] = useState(() => storageService.getOpenAssessments());
  const [activeTask, setActiveTask] = useState(null); // 'open' | 'fist' | 'pinch' | 'wave' | null
  const [taskReps, setTaskReps] = useState(0);

  // Current average angle to which the user is opening their fingers
  const currentAvg = Number((currentAngles.reduce((a, b) => a + b, 0) / currentAngles.length).toFixed(1));

  // Baseline angle (initial open state, e.g. 30.0°)
  const baseline = assessments.length > 0 ? assessments[0].baseline : 30.0;

  // Improvement vs baseline: positive means angle is smaller (closer to 15° = opened wider)
  const currentDeltaVsBaseline = Number((baseline - currentAvg).toFixed(1));

  // Most recent recorded trial
  const latestTrial = assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const isImprovingVsLatest = latestTrial ? currentAvg <= latestTrial.avgAngle : true;

  const handleRecordTrial = () => {
    const updated = storageService.recordOpenAssessment(currentAngles);
    setAssessments(updated);
  };

  // Quick Exercise Presets
  const runQuickTask = (taskType) => {
    setActiveTask(taskType);
    setTaskReps(prev => prev + 1);

    if (taskType === 'open') {
      hardwareService.setFingerTargets({ thumb: 15, index: 15, middle: 15, ring: 15, pinky: 15 });
    } else if (taskType === 'fist') {
      hardwareService.setFingerTargets({ thumb: 80, index: 92, middle: 95, ring: 90, pinky: 85 });
    } else if (taskType === 'pinch') {
      hardwareService.setFingerTargets({ thumb: 75, index: 85, middle: 20, ring: 20, pinky: 20 });
    } else if (taskType === 'spread') {
      hardwareService.setFingerTargets({ thumb: 15, index: 25, middle: 15, ring: 25, pinky: 15 });
    }

    if (onSessionComplete) {
      onSessionComplete({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: `Quick: ${taskType.toUpperCase()}`,
        detail: `Angle Avg: ${currentAvg}°`,
        reps: 1,
        peakPressure: 65,
        achievedFlex: currentAvg
      });
    }
  };

  const handleReleaseAir = () => {
    setActiveTask(null);
    hardwareService.togglePressureRelief();
  };

  return (
    <div className="workstation-card p-3.5 space-y-3 select-none shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Hand Opening & Daily Practice Tasks
            </h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              currentDeltaVsBaseline >= 0
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}>
              {currentDeltaVsBaseline >= 0 ? `▲ +${currentDeltaVsBaseline}° WIDER (IMPROVED)` : `▼ ${Math.abs(currentDeltaVsBaseline)}° STIFFER`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Test how wide your hand opens and launch quick daily exercise tasks.
          </p>
        </div>

        <button
          onClick={handleRecordTrial}
          className="flex items-center gap-1.5 btn-primary-light font-mono text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
          title="Save your current hand openness score"
        >
          <Camera className="w-3.5 h-3.5" />
          TEST HAND OPENING NOW
        </button>
      </div>

      {/* Quick Exercise Launcher Bar (Utilizing the Space For Daily Tasks) */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold font-mono text-slate-800 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Quick Therapy Tasks (1-Click Start)
          </span>
          {activeTask && (
            <button
              onClick={handleReleaseAir}
              className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded transition flex items-center gap-1"
            >
              <Wind className="w-3 h-3 text-amber-700" />
              RELEASE AIR
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => runQuickTask('open')}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-mono font-semibold transition ${
              activeTask === 'open'
                ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
            }`}
          >
            <span>🖐</span>
            <span>Open Hand</span>
          </button>

          <button
            onClick={() => runQuickTask('fist')}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-mono font-semibold transition ${
              activeTask === 'fist'
                ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
            }`}
          >
            <span>✊</span>
            <span>Fist Curl</span>
          </button>

          <button
            onClick={() => runQuickTask('pinch')}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-mono font-semibold transition ${
              activeTask === 'pinch'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
            }`}
          >
            <span>🤏</span>
            <span>Pinch Grip</span>
          </button>

          <button
            onClick={() => runQuickTask('spread')}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-mono font-semibold transition ${
              activeTask === 'spread'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
            }`}
          >
            <span>👋</span>
            <span>Finger Spread</span>
          </button>
        </div>
      </div>

      {/* Main Hand Opening Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Live Average Open Angle */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase mb-0.5">
            <span>Average Openness</span>
            <span className="text-sky-700 font-bold">5 FINGERS</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 my-0.5 flex items-baseline gap-1.5">
            <span>{currentAvg}°</span>
            <span className="text-xs font-normal text-slate-500">average</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            <span>Goal (Open Hand):</span>
            <strong className="text-slate-800">15.0°</strong>
          </div>
        </div>

        {/* 2. Baseline & Improvement Delta */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase mb-0.5">
            <span>Progress Since Day 1</span>
            <span>Started ({baseline}°)</span>
          </div>
          <div className="text-xl font-bold font-mono my-0.5 flex items-baseline gap-1.5">
            <span className={currentDeltaVsBaseline >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {currentDeltaVsBaseline >= 0 ? `+${currentDeltaVsBaseline}°` : `${currentDeltaVsBaseline}°`}
            </span>
            <span className="text-xs font-normal text-slate-500">
              {currentDeltaVsBaseline >= 0 ? 'wider' : 'stiffer'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {currentDeltaVsBaseline >= 0 ? 'Fingers are opening wider' : 'Hand feeling a bit stiffer'}
          </div>
        </div>

        {/* 3. Latest Verdict */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-500 uppercase mb-0.5">
            Current Result
          </div>
          <div className="flex items-center gap-2">
            {isImprovingVsLatest ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {isImprovingVsLatest ? 'Hand Opening Is Improving!' : 'Hand Feeling Stiffer'}
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Completed Reps Today: <strong className="text-slate-800">{taskReps}</strong>
          </div>
        </div>
      </div>

      {/* Visual Hand Opening Gauge */}
      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-600">
          <span>Very Stiff (50°+)</span>
          <span>Day 1 ({baseline}°)</span>
          <span className="font-bold text-teal-800">You Now ({currentAvg}°)</span>
          <span>Fully Open (15°)</span>
        </div>

        {/* Progressive Visual Bar */}
        <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
          <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-emerald-100 border-l border-emerald-300"></div>
          <div
            className={`absolute top-0 bottom-0 rounded-full transition-all duration-300 ${
              currentAvg <= 20 ? 'bg-emerald-600' : currentAvg <= 30 ? 'bg-teal-600' : 'bg-amber-600'
            }`}
            style={{
              width: `${Math.min(100, Math.max(5, ((60 - currentAvg) / 45) * 100))}%`
            }}
          />
        </div>
      </div>

      {/* Individual Finger Open Angles Strip */}
      <div className="grid grid-cols-5 gap-2">
        {FINGERS.map((f, idx) => {
          const angle = currentAngles[idx] || 15;
          const isExtended = angle <= 22;
          return (
            <div key={f.id} className="bg-white border border-slate-200 p-1.5 rounded-lg text-center shadow-2xs">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">
                {f.name}
              </span>
              <div className="text-xs font-bold font-mono text-slate-900 my-0.5">
                {angle.toFixed(1)}°
              </div>
              <span className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded ${
                isExtended ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
              }`}>
                {isExtended ? 'OPEN' : 'PARTIAL'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
