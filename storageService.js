// Storage Service for PneumoGlove Pro
// Handles persistent local storage of training logs, calibrations, and monthly clinical progress comparisons

const STORAGE_KEYS = {
  SESSIONS: 'pneumoglove_sessions_v1',
  PATIENT: 'pneumoglove_patient_v1',
  MONTHLY_DATA: 'pneumoglove_monthly_data_v1',
  CALIBRATION: 'pneumoglove_calibration_v1',
  OPEN_ASSESSMENTS: 'pneumoglove_open_assessments_v1'
};

// Default initial monthly progress benchmarks (Last Month vs This Month)
const DEFAULT_MONTHLY_DATA = {
  lastMonth: {
    period: 'August 2026',
    timestamp: '2026-08-18',
    // Angles: [Thumb, Index, Middle, Ring, Pinky]
    extensionAngles: [23.5, 25.1, 24.8, 26.2, 25.0], // Higher extension angle = stiffer/contracted
    flexionAngles: [68.0, 71.5, 73.0, 69.2, 65.4],    // Lower flexion angle = weak grip
    peakPressureKPa: 85.0,
    gestureAccuracyAvg: 58.4,
    fineTrainingCycles: 45,
    functionalSessions: 12
  },
  thisMonth: {
    period: 'September 2026',
    timestamp: '2026-09-19',
    extensionAngles: [16.2, 16.5, 17.1, 17.8, 16.9], // Near normal extension (~15-17°)
    flexionAngles: [85.5, 91.2, 93.4, 88.6, 86.0],   // Significant flexion improvement (~86-94°)
    peakPressureKPa: 138.5,
    gestureAccuracyAvg: 81.2,
    fineTrainingCycles: 95,
    functionalSessions: 26
  }
};

const DEFAULT_SESSIONS = [
  {
    id: 'sess-1',
    timestamp: '2026-09-19 11:20:15',
    mode: 'Fine Training',
    detail: 'Index Finger Isolation',
    finger: 'index',
    cycles: 10,
    cpm: 6,
    achievedFlex: 92.4,
    achievedExt: 16.1,
    status: 'Completed'
  },
  {
    id: 'sess-2',
    timestamp: '2026-09-19 11:32:40',
    mode: 'Functional Training',
    detail: 'Full-Hand Fist Closure',
    exercise: 'Full-Hand Fist Closure',
    reps: 8,
    peakPressure: 138.5,
    holdDuration: '4.0s',
    status: 'Completed'
  },
  {
    id: 'sess-3',
    timestamp: '2026-09-18 16:15:00',
    mode: 'Gesture Training',
    detail: 'VICTOR (Peace Sign)',
    gesture: 'VICTOR',
    accuracy: 84,
    status: 'Completed'
  },
  {
    id: 'sess-4',
    timestamp: '2026-09-18 15:45:10',
    mode: 'Functional Training',
    detail: 'Two-Finger Pinch',
    exercise: 'Two-Finger Pinch',
    reps: 10,
    peakPressure: 112.0,
    holdDuration: '3.0s',
    status: 'Completed'
  }
];

class StorageService {
  getSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : DEFAULT_SESSIONS;
    } catch (e) {
      console.error('Failed to read sessions from localStorage:', e);
      return DEFAULT_SESSIONS;
    }
  }

  saveSession(session) {
    try {
      const sessions = this.getSessions();
      const newSession = {
        id: 'sess-' + Date.now(),
        timestamp: new Date().toLocaleString(),
        ...session,
        status: 'Completed'
      };
      const updated = [newSession, ...sessions];
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save session to localStorage:', e);
      return this.getSessions();
    }
  }

  clearSessions() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      return [];
    } catch (e) {
      console.error('Failed to clear sessions:', e);
      return [];
    }
  }

  getMonthlyData() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MONTHLY_DATA);
      return data ? JSON.parse(data) : DEFAULT_MONTHLY_DATA;
    } catch (e) {
      console.error('Failed to read monthly data from localStorage:', e);
      return DEFAULT_MONTHLY_DATA;
    }
  }

  saveMonthlyData(monthlyData) {
    try {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_DATA, JSON.stringify(monthlyData));
      return monthlyData;
    } catch (e) {
      console.error('Failed to save monthly data:', e);
      return this.getMonthlyData();
    }
  }

  recordCurrentMonthSnapshot(currentAngles, peakPressure, avgAccuracy) {
    const data = this.getMonthlyData();
    const updated = {
      ...data,
      thisMonth: {
        ...data.thisMonth,
        timestamp: new Date().toISOString().split('T')[0],
        extensionAngles: currentAngles.map(a => Number(Math.min(a, 25).toFixed(1))),
        flexionAngles: currentAngles.map(a => Number(Math.max(a, 60).toFixed(1))),
        peakPressureKPa: peakPressure > 0 ? Number(peakPressure.toFixed(1)) : data.thisMonth.peakPressureKPa,
        gestureAccuracyAvg: avgAccuracy > 0 ? Number(avgAccuracy.toFixed(1)) : data.thisMonth.gestureAccuracyAvg
      }
    };
    return this.saveMonthlyData(updated);
  }

  getPatient() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENT);
      return data ? JSON.parse(data) : {
        id: 'PT-8821',
        name: 'Eleanor Vance',
        condition: 'Post-Stroke Hemiparesis',
        affectedHand: 'Right',
        lastCalibrated: '2026-09-18'
      };
    } catch (e) {
      return {
        id: 'PT-8821',
        name: 'Eleanor Vance',
        condition: 'Post-Stroke Hemiparesis',
        affectedHand: 'Right',
        lastCalibrated: '2026-09-18'
      };
    }
  }

  savePatient(patient) {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(patient));
    } catch (e) {
      console.error('Failed to save patient:', e);
    }
  }

  // Hand Opening (Extension ROM) Improvement/Deprovement Tracking
  getOpenAssessments() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OPEN_ASSESSMENTS);
      if (data) return JSON.parse(data);

      // Default baseline progression
      const defaults = [
        {
          id: 'oa-1',
          timestamp: '2026-08-18 10:15',
          date: 'Aug 18',
          avgAngle: 25.0,
          baseline: 30.0,
          deltaVsBaseline: 5.0, // positive = improvement (opened 5° wider)
          deltaVsPrevious: 5.0,
          status: 'improvement',
          angles: [23.5, 25.1, 24.8, 26.2, 25.0]
        },
        {
          id: 'oa-2',
          timestamp: '2026-08-28 14:20',
          date: 'Aug 28',
          avgAngle: 22.4,
          baseline: 30.0,
          deltaVsBaseline: 7.6,
          deltaVsPrevious: 2.6,
          status: 'improvement',
          angles: [21.0, 22.5, 22.8, 23.4, 22.3]
        },
        {
          id: 'oa-3',
          timestamp: '2026-09-08 11:00',
          date: 'Sep 08',
          avgAngle: 19.8,
          baseline: 30.0,
          deltaVsBaseline: 10.2,
          deltaVsPrevious: 2.6,
          status: 'improvement',
          angles: [18.5, 19.8, 20.2, 20.8, 19.7]
        },
        {
          id: 'oa-4',
          timestamp: '2026-09-18 16:30',
          date: 'Sep 18',
          avgAngle: 16.8,
          baseline: 30.0,
          deltaVsBaseline: 13.2,
          deltaVsPrevious: 3.0,
          status: 'improvement',
          angles: [16.2, 16.5, 17.1, 17.8, 16.9]
        }
      ];
      localStorage.setItem(STORAGE_KEYS.OPEN_ASSESSMENTS, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      console.error('Failed to read open assessments:', e);
      return [];
    }
  }

  recordOpenAssessment(currentAngles) {
    try {
      const assessments = this.getOpenAssessments();
      const avg = Number((currentAngles.reduce((a, b) => a + b, 0) / currentAngles.length).toFixed(1));
      const baseline = assessments.length > 0 ? assessments[0].baseline : 30.0;
      
      // In extension, lower angle means fingers open wider towards nominal 15°.
      // Improvement: angle decreases (baseline - avg is positive).
      const deltaVsBaseline = Number((baseline - avg).toFixed(1));
      
      // Compare with most recent assessment
      const last = assessments.length > 0 ? assessments[assessments.length - 1] : null;
      const deltaVsPrevious = last ? Number((last.avgAngle - avg).toFixed(1)) : deltaVsBaseline;
      
      // If deltaVsPrevious is negative, angle increased (fingers got stiffer / couldn't open as much = deprovement)
      const status = deltaVsPrevious >= -0.3 ? 'improvement' : 'deprovement';

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newAssessment = {
        id: 'oa-' + Date.now(),
        timestamp: timeStr,
        date: dateStr,
        avgAngle: avg,
        baseline: baseline,
        deltaVsBaseline: deltaVsBaseline,
        deltaVsPrevious: deltaVsPrevious,
        status: status,
        angles: currentAngles.map(a => Number(a.toFixed(1)))
      };

      const updated = [...assessments, newAssessment];
      localStorage.setItem(STORAGE_KEYS.OPEN_ASSESSMENTS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to record open assessment:', e);
      return this.getOpenAssessments();
    }
  }

  clearOpenAssessments() {
    try {
      localStorage.removeItem(STORAGE_KEYS.OPEN_ASSESSMENTS);
      return [];
    } catch (e) {
      return [];
    }
  }
}

export const storageService = new StorageService();
