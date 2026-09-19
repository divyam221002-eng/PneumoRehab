import React, { useState } from 'react';
import { FINGERS } from '../constants/gestures';
import { Wind, ShieldCheck, Activity, Cpu, Box, LayoutGrid } from 'lucide-react';
import Glove3DVisualizer from './Glove3DVisualizer';

export default function HandVisualizer({
  angles = [15, 16, 17, 16, 15],
  pressures = [0, 0, 0, 0, 0],
  palmAngle = 18.0,
  reliefActive = false,
  safetyThresholds = {}
}) {
  const [viewMode, setViewMode] = useState('2d'); // '2d' (initial glove) | '3d'

  const fingerConfigs = [
    { id: 'thumb', index: 0, channel: 'CH-1', name: 'THUMB', baseX: 110, baseY: 280, length: 105, angleOffset: -42, color: '#d97706', darkColor: '#b45309' },
    { id: 'index', index: 1, channel: 'CH-2', name: 'INDEX', baseX: 148, baseY: 185, length: 140, angleOffset: -12, color: '#0d9488', darkColor: '#0f766e' },
    { id: 'middle', index: 2, channel: 'CH-3', name: 'MIDDLE', baseX: 200, baseY: 170, length: 160, angleOffset: 0, color: '#0284c7', darkColor: '#0369a1' },
    { id: 'ring', index: 3, channel: 'CH-4', name: 'RING', baseX: 252, baseY: 185, length: 145, angleOffset: 10, color: '#6366f1', darkColor: '#4f46e5' },
    { id: 'pinky', index: 4, channel: 'CH-5', name: 'PINKY', baseX: 298, baseY: 210, length: 115, angleOffset: 22, color: '#db2777', darkColor: '#be185d' },
  ];

  return (
    <div className="space-y-4">
      {/* Main Glove Visualizer Card */}
      <div className="workstation-card p-4 flex flex-col select-none">
        {/* Schematic Header & View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-mono">
                {viewMode === '2d' ? 'Live Hand & Sensor Map' : '3D Robotic Glove View'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium">
                Right Hand • Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {viewMode === '2d'
                ? 'Shows real-time finger bending, air pressure, and palm tilt angle from the sensor.'
                : 'Interactive 3D view: Drag to rotate, scroll to zoom in and out.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {reliefActive && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 px-2.5 py-1 rounded text-xs font-mono font-semibold animate-pulse shadow-xs">
                <Wind className="w-3.5 h-3.5 text-amber-600" />
                <span>VENT: ACTIVE</span>
              </div>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs font-mono">
              <button
                onClick={() => setViewMode('2d')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                  viewMode === '2d'
                    ? 'bg-white text-sky-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to 2D technical blueprint"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>2D HAND MAP</span>
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                  viewMode === '3d'
                    ? 'bg-white text-sky-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to 3D articulated model"
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D GLOVE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Viewport Canvas: 2D Blueprint or 3D WebGL */}
        <div className="relative flex-1 flex items-center justify-center min-h-[350px] rounded-lg border border-slate-200 overflow-hidden shadow-inner bg-slate-50">
          {viewMode === '3d' ? (
            <Glove3DVisualizer
              angles={angles}
              pressures={pressures}
              safetyThresholds={safetyThresholds}
            />
          ) : (
            <div className="w-full h-full min-h-[350px] bg-tech-grid-light p-2 flex items-center justify-center">
              <svg viewBox="0 0 400 420" className="w-full h-full max-h-[360px]">
                <defs>
                  <linearGradient id="handMeshLight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                  </linearGradient>

                  <linearGradient id="manifoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                {/* Anatomical Hand Contour */}
                <path
                  d="M 95 285 Q 110 345 150 375 Q 200 395 260 375 Q 315 345 325 265 L 305 210 L 252 185 L 200 170 L 148 185 L 95 285 Z"
                  fill="url(#handMeshLight)"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Metacarpal Bone Axis Lines */}
                <line x1="200" y1="310" x2="110" y2="280" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="200" y1="310" x2="148" y2="185" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="200" y1="310" x2="200" y2="170" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="200" y1="310" x2="252" y2="185" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="200" y1="310" x2="298" y2="210" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Carpal Manifold Hub */}
                <rect x="155" y="295" width="90" height="34" rx="6" fill="url(#manifoldLight)" stroke="#0284c7" strokeWidth="1.5" />
                <text x="200" y="309" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  AIR MANIFOLD
                </text>
                <text x="200" y="321" fill="#cbd5e1" fontSize="7" fontFamily="monospace" textAnchor="middle">
                  5 AIR CHANNELS
                </text>

                {/* Ankle / Wrist Sensor Module for Palm Angular Movement */}
                <g transform="translate(140, 340)">
                  <rect x="0" y="0" width="120" height="36" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                  <circle cx="16" cy="18" r="6" fill="#0284c7" />
                  <circle cx="16" cy="18" r="3" fill="#38bdf8" />
                  <text x="28" y="14" fill="#38bdf8" fontSize="7" fontWeight="bold" fontFamily="monospace">
                    PALM ANGLE SENSOR
                  </text>
                  <text x="28" y="27" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                    TILT: {palmAngle.toFixed(1)}°
                  </text>
                  <text x="94" y="26" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
                    ANKLE/WRIST
                  </text>
                </g>

                {/* Render fingers */}
                {fingerConfigs.map((cfg) => {
                  const angle = angles[cfg.index] || 15;
                  const pressure = pressures[cfg.index] || 0;
                  const threshold = safetyThresholds[cfg.id] || { max: 92, min: 12 };
                  const isWarning = angle > threshold.max - 6;
                  const isFault = angle >= threshold.max;

                  const bendFactor = (angle - 15) / 80;
                  const radOffset = (cfg.angleOffset * Math.PI) / 180;
                  const effectiveLength = cfg.length * (1 - bendFactor * 0.35);

                  const mcpX = cfg.baseX;
                  const mcpY = cfg.baseY;

                  const tipX = mcpX + Math.sin(radOffset) * effectiveLength;
                  const tipY = mcpY - Math.cos(radOffset) * effectiveLength + (bendFactor * 68);

                  const pipX = (mcpX * 0.55 + tipX * 0.45) + Math.sin(radOffset + 0.35) * (bendFactor * 26);
                  const pipY = (mcpY * 0.55 + tipY * 0.45) + (bendFactor * 22);

                  const dipX = (mcpX * 0.25 + tipX * 0.75) + Math.sin(radOffset + 0.2) * (bendFactor * 16);
                  const dipY = (mcpY * 0.25 + tipY * 0.75) + (bendFactor * 14);

                  const pRatio = Math.min(1, Math.max(0, pressure / 140));
                  const bellowsWidth = 9 + pRatio * 8;
                  const bellowsColor = isFault ? '#dc2626' : isWarning ? '#d97706' : cfg.color;

                  return (
                    <g key={cfg.id} className="group">
                      <path
                        d={`M 200 295 Q ${(mcpX + 200) / 2} ${(mcpY + 295) / 2 + 10} ${mcpX} ${mcpY}`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="2 3"
                      />

                      <path
                        d={`M ${mcpX} ${mcpY} Q ${pipX} ${pipY} ${dipX} ${dipY} T ${tipX} ${tipY}`}
                        fill="none"
                        stroke={bellowsColor}
                        strokeWidth={bellowsWidth}
                        strokeLinecap="round"
                        strokeOpacity={0.4 + pRatio * 0.45}
                      />

                      <path
                        d={`M ${mcpX} ${mcpY} Q ${pipX} ${pipY} ${dipX} ${dipY} T ${tipX} ${tipY}`}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeDasharray="4 6"
                        strokeOpacity="0.9"
                      />

                      <path
                        d={`M ${mcpX} ${mcpY} Q ${pipX} ${pipY} ${dipX} ${dipY} T ${tipX} ${tipY}`}
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.5"
                        strokeLinecap="square"
                      />

                      <circle cx={mcpX} cy={mcpY} r="4" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
                      <circle cx={pipX} cy={pipY} r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                      <circle cx={dipX} cy={dipY} r="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                      <circle cx={tipX} cy={tipY} r="5" fill={bellowsColor} stroke="#ffffff" strokeWidth="1.5" />

                      <g transform={`translate(${tipX}, ${tipY - 16})`}>
                        <rect
                          x="-24"
                          y="-11"
                          width="48"
                          height="16"
                          rx="3"
                          fill="#ffffff"
                          stroke={isFault ? '#dc2626' : isWarning ? '#d97706' : '#0284c7'}
                          strokeWidth="1.5"
                          className="shadow-xs"
                        />
                        <text
                          x="0"
                          y="1"
                          fill="#0f172a"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {angle.toFixed(1)}°
                        </text>
                      </g>

                      <text
                        x={mcpX}
                        y={mcpY + 14}
                        fill="#64748b"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {cfg.channel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* 6-Channel Modular Readout Strip (5 Fingers + 1 Palm/Wrist Sensor) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 select-none">
          {fingerConfigs.map((cfg) => {
            const angle = angles[cfg.index] || 15;
            const pressure = pressures[cfg.index] || 0;
            const threshold = safetyThresholds[cfg.id] || { min: 12, max: 92 };
            const isWarning = angle > threshold.max - 6;
            const isFault = angle >= threshold.max;

            return (
              <div
                key={cfg.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  isFault
                    ? 'bg-rose-50 border-rose-300 shadow-xs'
                    : isWarning
                    ? 'bg-amber-50 border-amber-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {cfg.channel}
                  </span>
                  <span className="text-[11px] font-bold tracking-tight" style={{ color: cfg.darkColor }}>
                    {cfg.name}
                  </span>
                </div>

                <div className="text-lg font-bold font-mono tracking-tight text-slate-900 my-0.5">
                  {angle.toFixed(1)}°
                </div>

                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>AIR:</span>
                    <span className="font-semibold text-slate-800">{pressure.toFixed(0)} kPa</span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-xs transition-all duration-100 ${
                        pressure > 130 ? 'bg-rose-600' : pressure > 90 ? 'bg-amber-500' : 'bg-sky-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (pressure / 150) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400">BENT:</span>
                  <span className={isFault ? 'text-rose-600 font-bold' : isWarning ? 'text-amber-600 font-bold' : 'text-slate-700 font-semibold'}>
                    {Math.round(((angle - 15) / 80) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* 6th Card: Palm & Ankle/Wrist Tilt Sensor */}
          <div className="p-2.5 rounded-lg border bg-sky-50/70 border-sky-200 hover:border-sky-300 transition-all select-none">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-sky-700">
                CH-6
              </span>
              <span className="text-[11px] font-bold tracking-tight text-sky-900">
                PALM TILT
              </span>
            </div>

            <div className="text-lg font-bold font-mono tracking-tight text-slate-900 my-0.5">
              {palmAngle.toFixed(1)}°
            </div>

            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>SENSOR:</span>
                <span className="font-semibold text-slate-800">ANKLE/WRIST</span>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded overflow-hidden p-0.5">
                <div
                  className="h-full rounded-xs bg-sky-600 transition-all duration-100"
                  style={{ width: `${Math.min(100, Math.max(10, ((palmAngle + 30) / 90) * 100))}%` }}
                />
              </div>
            </div>

            <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-400">STATE:</span>
              <span className="text-sky-800 font-semibold">
                {palmAngle > 20 ? 'TILTED UP' : palmAngle < 5 ? 'TILTED DOWN' : 'LEVEL'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
