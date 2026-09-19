import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity, Gauge, Compass, Radio } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHANNEL_PALETTE = [
  { name: 'Thumb', color: '#d97706' },
  { name: 'Index', color: '#0d9488' },
  { name: 'Middle', color: '#0284c7' },
  { name: 'Ring', color: '#6366f1' },
  { name: 'Pinky', color: '#db2777' },
];

export default function WaveformCharts({ history = [], palmAngle = 18.0 }) {
  const maxPoints = 25;
  const slicedHistory = history.slice(-maxPoints);
  const labels = slicedHistory.map(h => h.time || '');

  // 1. Finger Angles Data (5 Channels)
  const angleData = {
    labels,
    datasets: CHANNEL_PALETTE.map((ch, idx) => ({
      label: ch.name,
      data: slicedHistory.map(h => (h.angles ? h.angles[idx] : 15)),
      borderColor: ch.color,
      backgroundColor: ch.color + '15',
      borderWidth: 2,
      tension: 0.25,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true
    }))
  };

  // 2. Air Pressure Data (5 Channels)
  const pressureData = {
    labels,
    datasets: CHANNEL_PALETTE.map((ch, idx) => ({
      label: ch.name,
      data: slicedHistory.map(h => (h.pressures ? h.pressures[idx] : 0)),
      borderColor: ch.color,
      borderWidth: 1.75,
      borderDash: [4, 3],
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
    }))
  };

  // 3. Palm & Wrist Angle Data (Ankle / Wrist Sensor)
  const palmData = {
    labels,
    datasets: [
      {
        label: 'Palm Tilt Angle',
        data: slicedHistory.map(h => (h.palmAngle !== undefined ? h.palmAngle : palmAngle)),
        borderColor: '#0284c7',
        backgroundColor: '#0284c71a',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true
      }
    ]
  };

  // Latest values for badges
  const latestEntry = slicedHistory[slicedHistory.length - 1] || {};
  const currentAngles = latestEntry.angles || [15, 15, 15, 15, 15];
  const avgAngle = (currentAngles.reduce((a, b) => a + b, 0) / currentAngles.length).toFixed(0);
  const currentPressures = latestEntry.pressures || [0, 0, 0, 0, 0];
  const maxPressure = Math.max(...currentPressures).toFixed(0);
  const currentPalm = (latestEntry.palmAngle !== undefined ? latestEntry.palmAngle : palmAngle).toFixed(1);

  const createChartOptions = (yTitle, yMin, yMax, unit, showLegend = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
        labels: {
          color: '#475569',
          boxWidth: 7,
          boxHeight: 7,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 9, family: 'Inter', weight: '600' },
          padding: 6
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        padding: 6,
        titleFont: { family: 'JetBrains Mono', size: 10, weight: 'bold' },
        bodyFont: { family: 'JetBrains Mono', size: 9 },
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw.toFixed(1)} ${unit}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: { color: '#64748b', maxTicksLimit: 4, font: { size: 8, family: 'JetBrains Mono' } }
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: { color: '#64748b', font: { size: 8, family: 'JetBrains Mono' } },
        title: {
          display: true,
          text: yTitle,
          color: '#475569',
          font: { size: 8.5, weight: 'bold', family: 'Inter' }
        }
      }
    }
  });

  return (
    <div className="workstation-card p-3.5 space-y-3 select-none shadow-xs">
      {/* Header showing that all 3 graphs are active together */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight font-mono">
            Live Movement Graphs (All 3 Sensors Active)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            LIVE STREAM
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline">20 UPDATES/SEC</span>
        </div>
      </div>

      {/* All Graphs in a Separate Column Below Each Other */}
      <div className="flex flex-col space-y-2.5">
        {/* Graph 1: Finger Angles */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[11px] font-bold text-slate-800 font-mono uppercase">
                Finger Bending Angles
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">5 CHANNELS</span>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                AVG: {avgAngle}°
              </span>
            </div>
          </div>

          <div className="h-[110px] w-full">
            <Line data={angleData} options={createChartOptions('Bending (°)', 0, 110, '°', true)} />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 pt-0.5 border-t border-slate-100">
            <span>Thumb, Index, Middle, Ring, Pinky</span>
            <span>Range: 15°–98°</span>
          </div>
        </div>

        {/* Graph 2: Air Pressure */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[11px] font-bold text-slate-800 font-mono uppercase">
                Air Cushion Pressure
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">5 CUSHIONS</span>
              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
                PEAK: {maxPressure} kPa
              </span>
            </div>
          </div>

          <div className="h-[110px] w-full">
            <Line data={pressureData} options={createChartOptions('Pressure (kPa)', 0, 150, 'kPa', true)} />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 pt-0.5 border-t border-slate-100">
            <span>Air cushions hold force</span>
            <span>Limit: 75 kPa</span>
          </div>
        </div>

        {/* Graph 3: Palm Tilt (Ankle/Wrist Sensor) */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold text-slate-800 font-mono uppercase">
                Palm Tilt Angle (Ankle/Wrist)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">TILT SENSOR</span>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                TILT: {currentPalm}°
              </span>
            </div>
          </div>

          <div className="h-[100px] w-full">
            <Line data={palmData} options={createChartOptions('Tilt (°)', -10, 60, '°', false)} />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 pt-0.5 border-t border-slate-100">
            <span>Ankle/Wrist tilt calculation</span>
            <span>Tenodesis Synergy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
