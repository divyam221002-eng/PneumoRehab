import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FINGERS } from '../constants/gestures';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Layers,
  ClipboardList
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthlyComparison({
  monthlyData,
  onRecordSnapshot,
  currentAngles = [15, 16, 17, 16, 15],
  peakPressure = 0
}) {
  const { lastMonth, thisMonth } = monthlyData;
  const [metricView, setMetricView] = useState('flexion'); // 'flexion' | 'extension'

  const fingerComparisons = FINGERS.map((finger, idx) => {
    const lastExt = lastMonth.extensionAngles[idx] || 25;
    const thisExt = thisMonth.extensionAngles[idx] || 16;
    const extDiff = Number((lastExt - thisExt).toFixed(1));

    const lastFlex = lastMonth.flexionAngles[idx] || 70;
    const thisFlex = thisMonth.flexionAngles[idx] || 90;
    const flexDiff = Number((thisFlex - lastFlex).toFixed(1));

    const isFlexDeproved = flexDiff < -1.5;
    const isExtDeproved = extDiff < -1.5;
    const hasDeprovement = isFlexDeproved || isExtDeproved;

    return {
      finger,
      channel: `CH-${idx + 1}`,
      lastExt,
      thisExt,
      extDiff,
      lastFlex,
      thisFlex,
      flexDiff,
      isFlexDeproved,
      isExtDeproved,
      hasDeprovement
    };
  });

  const totalFlexDiff = fingerComparisons.reduce((acc, f) => acc + f.flexDiff, 0);
  const avgFlexDiff = (totalFlexDiff / fingerComparisons.length).toFixed(1);

  const totalExtDiff = fingerComparisons.reduce((acc, f) => acc + f.extDiff, 0);
  const avgExtDiff = (totalExtDiff / fingerComparisons.length).toFixed(1);

  const pressureDiff = Number((thisMonth.peakPressureKPa - lastMonth.peakPressureKPa).toFixed(1));
  const accuracyDiff = Number((thisMonth.gestureAccuracyAvg - lastMonth.gestureAccuracyAvg).toFixed(1));

  const deprovedFingers = fingerComparisons.filter(f => f.hasDeprovement);
  const hasAnyDeprovement = deprovedFingers.length > 0;

  const labels = FINGERS.map((f, i) => `CH-${i + 1} ${f.name.toUpperCase()}`);

  const chartData = {
    labels,
    datasets: [
      {
        label: `${lastMonth.period} (${metricView === 'flexion' ? 'Baseline Flexion' : 'Baseline Extension'})`,
        data: metricView === 'flexion'
          ? fingerComparisons.map(f => f.lastFlex)
          : fingerComparisons.map(f => f.lastExt),
        backgroundColor: '#94a3b8',
        borderRadius: 4,
      },
      {
        label: `${thisMonth.period} (${metricView === 'flexion' ? 'Current Flexion' : 'Current Extension'})`,
        data: metricView === 'flexion'
          ? fingerComparisons.map(f => f.thisFlex)
          : fingerComparisons.map(f => f.thisExt),
        backgroundColor: metricView === 'flexion' ? '#0284c7' : '#0d9488',
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#475569',
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'rect',
          font: { size: 11, family: 'JetBrains Mono', weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 10 },
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw}°`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#475569', font: { family: 'JetBrains Mono', size: 10, weight: 'bold' } }
      },
      y: {
        min: 0,
        max: 110,
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
        title: {
          display: true,
          text: 'JOINT ANGLE (°)',
          color: '#475569',
          font: { family: 'JetBrains Mono', size: 10, weight: 'bold' }
        }
      }
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Dossier Header & Benchmark Capture */}
      <div className="workstation-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-teal-600 shadow-2xs"></span>
              <h2 className="text-base font-bold font-mono text-slate-900 tracking-tight uppercase">
                Monthly Hand Recovery & Improvement Progress
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing your hand movement: Baseline (<span className="font-mono font-semibold text-slate-700">{lastMonth.period}</span>) vs. Today (<span className="font-mono font-semibold text-teal-700">{thisMonth.period}</span>).
            </p>
          </div>

          <button
            onClick={onRecordSnapshot}
            className="flex items-center gap-1.5 btn-primary-light font-mono text-xs font-semibold px-4 py-2 rounded-lg"
            title="Save today's live glove angles and pressure as your monthly record"
          >
            <Camera className="w-3.5 h-3.5" />
            SAVE TODAY'S SCORES
          </button>
        </div>

        {/* Clinical Assessment Summary */}
        <div className="mt-4 p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {hasAnyDeprovement ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold font-mono uppercase text-slate-900 flex items-center gap-2">
                <span>Overall Progress:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  hasAnyDeprovement ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold' : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                }`}>
                  {hasAnyDeprovement ? 'SOME FINGERS STIFFER - FOCUS PRACTICE' : 'EXCELLENT PROGRESS ACROSS ALL FINGERS'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {hasAnyDeprovement
                  ? `Overall finger bending improved by +${avgFlexDiff}°, but stiffness increased on: ${deprovedFingers.map(f => f.finger.name).join(', ')}. Focus more practice on these fingers.`
                  : `Great progress: you can bend your fingers +${avgFlexDiff}° further, straighten your hand +${avgExtDiff}° flatter, and your grip strength increased by +${pressureDiff} kPa.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-300 self-start md:self-auto shrink-0 font-mono text-xs shadow-2xs">
            <div className="text-center px-2">
              <span className="text-[9px] text-slate-500 block uppercase">BENDING GAIN</span>
              <strong className="text-sky-700 font-bold text-sm">+{avgFlexDiff}°</strong>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="text-center px-2">
              <span className="text-[9px] text-slate-500 block uppercase">FLATTER HAND</span>
              <strong className="text-teal-700 font-bold text-sm">+{avgExtDiff}°</strong>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="text-center px-2">
              <span className="text-[9px] text-slate-500 block uppercase">GRIP FORCE</span>
              <strong className="text-indigo-700 font-bold text-sm">+{pressureDiff} kPa</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Clinical Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Flexion ROM */}
        <div className="workstation-card p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
            <span>Finger Bending (Curl)</span>
            <span>{lastMonth.period.slice(0, 3)} &rarr; {thisMonth.period.slice(0, 3)}</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              +{avgFlexDiff}°
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              +{avgFlexDiff}° BENT MORE
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Current: {fingerComparisons.map(f => `${f.thisFlex.toFixed(0)}°`).join(', ')}
          </div>
        </div>

        {/* Extension Contracture Relief */}
        <div className="workstation-card p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
            <span>Hand Opening (Flatter)</span>
            <span>{lastMonth.period.slice(0, 3)} &rarr; {thisMonth.period.slice(0, 3)}</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              +{avgExtDiff}°
            </span>
            <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
              LESS STIFFNESS
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Resting: {fingerComparisons.map(f => `${f.thisExt.toFixed(0)}°`).join(', ')}
          </div>
        </div>

        {/* Grip Strength */}
        <div className="workstation-card p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
            <span>Grip Holding Strength</span>
            <span>{lastMonth.peakPressureKPa} &rarr; {thisMonth.peakPressureKPa} kPa</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              +{pressureDiff} kPa
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
              +{((pressureDiff / lastMonth.peakPressureKPa) * 100).toFixed(0)}% STRONGER
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Air Cushion Hold Force
          </div>
        </div>

        {/* Gesture Accuracy */}
        <div className="workstation-card p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase mb-1">
            <span>Hand Shape Accuracy</span>
            <span>{lastMonth.gestureAccuracyAvg}% &rarr; {thisMonth.gestureAccuracyAvg}%</span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              +{accuracyDiff}%
            </span>
            <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
              BETTER CONTROL
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            13 Daily Hand Gestures
          </div>
        </div>
      </div>

      {/* Comparative Bar Chart */}
      <div className="workstation-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase">
              Finger Movement Comparison ({lastMonth.period} vs {thisMonth.period})
            </h3>
          </div>

          {/* Segmented Metric Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 font-mono text-xs">
            <button
              onClick={() => setMetricView('flexion')}
              className={`px-3 py-1 rounded-md text-xs transition ${
                metricView === 'flexion'
                  ? 'bg-white text-sky-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BENDING (CURLING)
            </button>
            <button
              onClick={() => setMetricView('extension')}
              className={`px-3 py-1 rounded-md text-xs transition ${
                metricView === 'extension'
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              STRAIGHTENING (OPEN FLAT)
            </button>
          </div>
        </div>

        <div className="h-[240px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Detailed Measurement Table */}
      <div className="workstation-card p-5 overflow-hidden">
        <h3 className="text-xs font-mono font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-600" />
          Finger-by-Finger Comparison Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                <th className="pb-2 font-bold uppercase">Finger</th>
                <th className="pb-2 font-bold uppercase">Last Month Bend</th>
                <th className="pb-2 font-bold uppercase">This Month Bend</th>
                <th className="pb-2 font-bold uppercase">Bend Change</th>
                <th className="pb-2 font-bold uppercase">Last Month Open</th>
                <th className="pb-2 font-bold uppercase">This Month Open</th>
                <th className="pb-2 font-bold uppercase">Open Change</th>
                <th className="pb-2 font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {fingerComparisons.map((fc) => {
                const flexImproved = fc.flexDiff > 0;
                const extImproved = fc.extDiff > 0;

                return (
                  <tr key={fc.finger.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900">
                      {fc.channel} {fc.finger.name.toUpperCase()}
                    </td>
                    <td className="py-2.5">{fc.lastFlex.toFixed(1)}°</td>
                    <td className="py-2.5 font-semibold text-slate-900">{fc.thisFlex.toFixed(1)}°</td>
                    <td className="py-2.5">
                      <span className={flexImproved ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                        {flexImproved ? '+' : ''}{fc.flexDiff}°
                      </span>
                    </td>
                    <td className="py-2.5">{fc.lastExt.toFixed(1)}°</td>
                    <td className="py-2.5 font-semibold text-slate-900">{fc.thisExt.toFixed(1)}°</td>
                    <td className="py-2.5">
                      <span className={extImproved ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                        {extImproved ? '+' : ''}{fc.extDiff}°
                      </span>
                    </td>
                    <td className="py-2.5">
                      {fc.hasDeprovement ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          STIFFER
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          IMPROVED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
