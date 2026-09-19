import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HandVisualizer from './components/HandVisualizer';
import WaveformCharts from './components/WaveformCharts';
import FineTraining from './components/TrainingModes/FineTraining';
import FunctionalTraining from './components/TrainingModes/FunctionalTraining';
import GestureTraining from './components/TrainingModes/GestureTraining';
import SafetyPanel from './components/SafetyPanel';
import SessionHistory from './components/SessionHistory';
import MonthlyComparison from './components/MonthlyComparison';
import PatientProfileModal from './components/PatientProfileModal';
import HandOpeningTracker from './components/HandOpeningTracker';
import { hardwareService } from './services/hardwareService';
import { storageService } from './services/storageService';
import { Target, Hand, Layers, Shield, History, TrendingUp } from 'lucide-react';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    angles: [15.0, 15.0, 15.0, 15.0, 15.0],
    pressures: [0, 0, 0, 0, 0],
    palmAngle: 18.0, // Ankle/Wrist sensor for palm angular movement
    relief: false,
    emergencyStop: false,
    battery: null, // Null when unpaired
    timestamp: Date.now()
  });

  const [telemetryHistory, setTelemetryHistory] = useState([]);

  const [connectionState, setConnectionState] = useState({
    connected: false,
    simulating: false, // Default to unpaired/disconnected
    port: null
  });

  // Active navigation tab ('monthly' | 'fine' | 'functional' | 'gestures' | 'safety' | 'history')
  const [activeTab, setActiveTab] = useState('monthly');

  const [safetyThresholds, setSafetyThresholds] = useState({
    thumb: { min: 12, max: 92 },
    index: { min: 12, max: 96 },
    middle: { min: 12, max: 98 },
    ring: { min: 12, max: 94 },
    pinky: { min: 12, max: 92 }
  });

  const [safetyAlert, setSafetyAlert] = useState(null);

  const [patient, setPatient] = useState(() => {
    return storageService.getPatient() || {
      id: 'PT-8821',
      name: 'Eleanor Vance',
      condition: 'Post-Stroke Hemiparesis',
      affectedHand: 'Right',
      lastCalibrated: '2026-09-18'
    };
  });

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Persistent Sessions from storageService
  const [sessions, setSessions] = useState(() => storageService.getSessions());

  // Persistent Monthly Comparison Data
  const [monthlyData, setMonthlyData] = useState(() => storageService.getMonthlyData());

  useEffect(() => {
    hardwareService.onTelemetry((data) => {
      setTelemetry(data);
      const now = new Date(data.timestamp);
      const timeStr = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;

      setTelemetryHistory((prev) => {
        const next = [...prev, {
          time: timeStr,
          angles: data.angles,
          pressures: data.pressures,
          palmAngle: data.palmAngle !== undefined ? data.palmAngle : 18.0,
          relief: data.relief
        }];
        if (next.length > 30) return next.slice(-30);
        return next;
      });
    });

    hardwareService.onSafetyAlert((alert) => {
      setSafetyAlert(alert);
    });

    hardwareService.onStatusChange((status) => {
      setConnectionState(status);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        hardwareService.emergencyStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleConnectSerial = async () => {
    try {
      await hardwareService.connectSerial();
    } catch (err) {
      alert(`Serial connection: ${err.message}`);
    }
  };

  const handleDisconnectSerial = async () => {
    await hardwareService.disconnectSerial();
  };

  const handleStartSimulation = () => {
    hardwareService.startSimulationMode();
  };

  const handleStopSimulation = () => {
    hardwareService.stopSimulationMode();
  };

  const handleSessionComplete = (sessionData) => {
    const updatedSessions = storageService.saveSession(sessionData);
    setSessions(updatedSessions);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all practice records?')) {
      const cleared = storageService.clearSessions();
      setSessions(cleared);
    }
  };

  const handleRecordSnapshot = () => {
    const maxP = Math.max(...telemetry.pressures);
    const updated = storageService.recordCurrentMonthSnapshot(telemetry.angles, maxP, 85);
    setMonthlyData(updated);
    alert("Today's hand angles and grip strength saved successfully!");
  };

  const handleExportCSV = () => {
    if (sessions.length === 0) return;
    const headers = ['Timestamp', 'Mode', 'Detail', 'Volume', 'Peak Pressure'];
    const rows = sessions.map(s => [
      s.timestamp,
      s.mode,
      s.detail || s.finger || s.exercise || s.gesture || 'N/A',
      s.cycles ? `${s.cycles} cycles` : s.reps ? `${s.reps} reps` : 'Done',
      s.peakPressure ? `${s.peakPressure} kPa` : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pneumoglove_rehab_${patient.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-workstation-light text-slate-900 flex flex-col antialiased">
      {/* Top Clinical Instrumentation Header */}
      <Header
        connectionState={connectionState}
        onConnectSerial={handleConnectSerial}
        onDisconnectSerial={handleDisconnectSerial}
        onStartSimulation={handleStartSimulation}
        onStopSimulation={handleStopSimulation}
        batteryVoltage={telemetry.battery}
        reliefActive={telemetry.relief}
        emergencyStop={telemetry.emergencyStop}
        activePatient={patient}
        onOpenPatientModal={() => setIsPatientModalOpen(true)}
      />

      {/* Main Workstation Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-5 space-y-4">
        {/* Top Section: Glove Visualizer, Graphs Column (Below Each Other), and Daily Tasks Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Column 1: Hand & Sensor Visualizer */}
          <div className="lg:col-span-4 xl:col-span-4">
            <HandVisualizer
              angles={telemetry.angles}
              pressures={telemetry.pressures}
              palmAngle={telemetry.palmAngle}
              reliefActive={telemetry.relief}
              safetyThresholds={safetyThresholds}
            />
          </div>

          {/* Column 2: Separate Column with All Graphs Stacked Below Each Other */}
          <div className="lg:col-span-4 xl:col-span-4">
            <WaveformCharts history={telemetryHistory} palmAngle={telemetry.palmAngle} />
          </div>

          {/* Column 3: Hand Opening & Daily Practice Tasks */}
          <div className="lg:col-span-4 xl:col-span-4">
            <HandOpeningTracker
              currentAngles={telemetry.angles}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        </div>

        {/* Simplified Navigation Deck */}
        <div className="bg-slate-200/90 p-1.5 rounded-xl border border-slate-300 shadow-inner flex items-center gap-1.5 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-white text-teal-800 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 font-medium'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>MONTHLY PROGRESS</span>
          </button>

          <button
            onClick={() => setActiveTab('fine')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              activeTab === 'fine'
                ? 'bg-white text-sky-800 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 font-medium'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-sky-600" />
            <span>SINGLE FINGER PRACTICE</span>
          </button>

          <button
            onClick={() => setActiveTab('functional')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              activeTab === 'functional'
                ? 'bg-white text-blue-800 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 font-medium'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-blue-600" />
            <span>HOLDING OBJECTS (DAILY TASKS)</span>
          </button>

          <button
            onClick={() => setActiveTab('gestures')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              activeTab === 'gestures'
                ? 'bg-white text-indigo-800 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 font-medium'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>HAND SHAPES & GESTURES (13)</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              activeTab === 'safety'
                ? 'bg-white text-amber-800 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 font-medium'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>SAFETY & AIR RELEASE</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 font-medium'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>PAST SESSIONS ({sessions.length})</span>
          </button>
        </div>

        {/* Dynamic Mode Console */}
        <div>
          {activeTab === 'monthly' && (
            <MonthlyComparison
              monthlyData={monthlyData}
              onRecordSnapshot={handleRecordSnapshot}
              currentAngles={telemetry.angles}
              peakPressure={Math.max(...telemetry.pressures)}
            />
          )}

          {activeTab === 'fine' && (
            <FineTraining
              currentAngles={telemetry.angles}
              onSessionComplete={handleSessionComplete}
            />
          )}

          {activeTab === 'functional' && (
            <FunctionalTraining
              pressures={telemetry.pressures}
              onSessionComplete={handleSessionComplete}
            />
          )}

          {activeTab === 'gestures' && (
            <GestureTraining
              angles={telemetry.angles}
              onSessionComplete={handleSessionComplete}
            />
          )}

          {activeTab === 'safety' && (
            <SafetyPanel
              safetyThresholds={safetyThresholds}
              onUpdateThresholds={setSafetyThresholds}
              reliefActive={telemetry.relief}
              emergencyStop={telemetry.emergencyStop}
              safetyAlert={safetyAlert}
              onClearAlert={() => setSafetyAlert(null)}
            />
          )}

          {activeTab === 'history' && (
            <SessionHistory
              sessions={sessions}
              onExportCSV={handleExportCSV}
              onClearHistory={handleClearHistory}
            />
          )}
        </div>
      </main>

      {/* Patient Profile & Calibration Modal */}
      <PatientProfileModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        activePatient={patient}
        onUpdatePatient={(p) => {
          setPatient(p);
          storageService.savePatient(p);
          if (p.thresholds) {
            setSafetyThresholds(p.thresholds);
            hardwareService.setSafetyThresholds(p.thresholds);
          }
        }}
        currentAngles={telemetry.angles}
      />
    </div>
  );
}
