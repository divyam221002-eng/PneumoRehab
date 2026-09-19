import React from 'react';
import { hardwareService } from '../services/hardwareService';
import {
  Usb,
  Cpu,
  Battery,
  AlertTriangle,
  User,
  Activity,
  Wind,
  ShieldCheck,
  Download,
} from 'lucide-react';

export default function Header({
  connectionState = { connected: false, simulating: false },
  onConnectSerial,
  onDisconnectSerial,
  onStartSimulation,
  onStopSimulation,
  batteryVoltage = null,
  reliefActive = false,
  emergencyStop = false,
  activePatient,
  onOpenPatientModal
}) {
  const handleEStop = () => {
    if (emergencyStop) {
      hardwareService.resetEmergencyStop();
    } else {
      hardwareService.emergencyStop();
    }
  };

  const handleToggleRelief = () => {
    hardwareService.togglePressureRelief();
  };

  const isDeviceActive = Boolean(connectionState?.connected || connectionState?.simulating);
  const hasBattery = isDeviceActive && batteryVoltage !== null && batteryVoltage !== undefined;
  const battPercent = hasBattery ? Math.min(100, Math.max(0, Math.round(((batteryVoltage - 10.5) / 2.1) * 100))) : 0;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs select-none">
      {/* Top Instrumentation Command Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Device Brand & Model */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-sky-400 text-base tracking-wider shadow-sm">
            PG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-base">
                PNEUMOGLOVE <span className="text-sky-700 font-mono font-semibold text-xs border border-sky-300 px-1.5 py-0.5 rounded bg-sky-50 shadow-xs">PRO-200</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50 hidden sm:inline">
                FW v3.2.1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isDeviceActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              Therapy Glove & Hand Recovery System
            </p>
          </div>
        </div>

        {/* Telemetry Status & Hardware Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Patient Card Link */}
          <button
            onClick={onOpenPatientModal}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-slate-800 transition btn-tactile-light"
            title="Open patient profile and calibration"
          >
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold text-slate-800">{activePatient?.name || 'Patient'}</span>
            <span className="text-[10px] font-mono text-slate-500 border-l border-slate-300 pl-1.5">
              {activePatient?.affectedHand || 'R'}-HAND
            </span>
          </button>

          {/* Direct Download ZIP Button */}
          <a
            href="/pneumatic-glove-rehab.zip"
            download="pneumatic-glove-rehab.zip"
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition btn-tactile-light"
            title="Download full project ZIP to run on any computer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>DOWNLOAD ZIP</span>
          </a>

          {/* Battery Status Gauge */}
          {hasBattery ? (
            <div
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-lg font-mono text-slate-700"
              title={`Battery: ${batteryVoltage.toFixed(1)}V (${battPercent}%)`}
            >
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-900 font-semibold">{batteryVoltage.toFixed(1)}V</span>
              <div className="w-8 h-2.5 bg-slate-200 rounded overflow-hidden p-0.5 border border-slate-300 flex gap-0.5">
                {[25, 50, 75, 100].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 rounded-xs transition-all ${
                      battPercent >= step ? (battPercent > 35 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-300/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg font-mono text-slate-500"
              title="Device not connected: Battery level unavailable"
            >
              <Battery className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-semibold">--.- V</span>
              <div className="w-8 h-2.5 bg-slate-200 rounded overflow-hidden p-0.5 border border-slate-300 flex gap-0.5">
                {[25, 50, 75, 100].map((step) => (
                  <div key={step} className="flex-1 rounded-xs bg-slate-300/40" />
                ))}
              </div>
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-tight ml-0.5">NOT PAIRED</span>
            </div>
          )}

          {/* Hardware Connection Controls */}
          {connectionState.connected ? (
            <button
              onClick={onDisconnectSerial}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-lg font-mono text-xs transition font-semibold"
              title="Glove connected via USB (Click to Disconnect)"
            >
              <span className="led-indicator led-green"></span>
              <Usb className="w-3.5 h-3.5 text-emerald-600" />
              <span>GLOVE: CONNECTED</span>
              <span className="text-[10px] font-sans bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-bold ml-1">DISCONNECT</span>
            </button>
          ) : connectionState.simulating ? (
            <div className="flex items-center gap-1 bg-sky-50 border border-sky-300 rounded-lg p-0.5">
              <div className="flex items-center gap-1.5 px-2 py-1 font-mono text-xs font-semibold text-sky-900">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                <Cpu className="w-3.5 h-3.5 text-sky-700" />
                <span>SIMULATOR ACTIVE</span>
              </div>
              <button
                onClick={onConnectSerial}
                className="bg-white hover:bg-sky-100 border border-sky-300 text-sky-900 px-2 py-1 rounded text-xs font-mono font-semibold transition"
                title="Connect physical USB glove"
              >
                <Usb className="w-3 h-3 inline mr-1 text-sky-700" />
                CONNECT USB
              </button>
              <button
                onClick={onStopSimulation}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 rounded text-xs font-mono transition"
                title="Stop simulator and return to unpaired state"
              >
                STOP
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-lg p-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>NO GLOVE PAIRED</span>
              </div>
              <button
                onClick={onConnectSerial}
                className="flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded text-xs font-mono font-semibold shadow-xs transition"
                title="Pair physical glove via USB"
              >
                <Usb className="w-3 h-3" />
                <span>CONNECT USB</span>
              </button>
              <button
                onClick={onStartSimulation}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-2.5 py-1 rounded text-xs font-mono font-semibold shadow-2xs transition"
                title="Run virtual glove simulator for testing"
              >
                <Cpu className="w-3 h-3 text-sky-600" />
                <span>SIMULATOR</span>
              </button>
            </div>
          )}

          {/* Relief Solenoid Toggle */}
          <button
            onClick={handleToggleRelief}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition ${
              reliefActive
                ? 'bg-amber-100 border-amber-400 text-amber-900 animate-pulse shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 btn-tactile-light'
            }`}
            title="Release air from all cushions"
          >
            <Wind className="w-3.5 h-3.5 text-amber-600" />
            <span>AIR VENT: {reliefActive ? 'OPEN (RELEASING)' : 'CLOSED (SEALED)'}</span>
          </button>

          {/* Industrial Emergency Stop Button */}
          <div className="pl-1 border-l border-slate-200">
            <button
              onClick={handleEStop}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition ${
                emergencyStop
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-500 animate-pulse shadow-md'
                  : 'btn-estop-bright text-white'
              }`}
              title="Emergency Stop (Stops all air immediately)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{emergencyStop ? 'RESET STOP' : 'EMERGENCY STOP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header Precision Telemetry Strip */}
      <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-1.5 text-[11px] font-mono text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-800">
              <span className={`w-1.5 h-1.5 rounded-full ${isDeviceActive ? 'bg-sky-600' : 'bg-slate-400'}`}></span>
              STATUS: <strong className={connectionState.connected ? 'text-emerald-700' : connectionState.simulating ? 'text-sky-700' : 'text-slate-500'}>
                {connectionState.connected ? 'GLOVE CONNECTED' : connectionState.simulating ? 'VIRTUAL SIMULATOR ACTIVE' : 'NO GLOVE CONNECTED'}
              </strong>
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:flex items-center gap-1">
              SENSORS: <span className="text-slate-800 font-semibold">{isDeviceActive ? '5 FINGERS + PALM TILT SENSOR' : 'OFFLINE'}</span>
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:flex items-center gap-1">
              SAFETY: <span className="text-emerald-700 font-semibold">AUTOMATIC PROTECTION ACTIVE</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>UPDATES: <strong className="text-slate-900">{isDeviceActive ? '50/sec' : '0/sec'}</strong></span>
            <span>DELAY: <strong className="text-slate-900">{isDeviceActive ? '14 ms' : '-- ms'}</strong></span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              PROTECTION: <strong className={emergencyStop ? 'text-rose-600' : isDeviceActive ? 'text-emerald-700' : 'text-slate-500'}>
                {emergencyStop ? 'STOPPED' : isDeviceActive ? 'SAFE & ACTIVE' : 'READY'}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
