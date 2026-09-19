export const FINGERS = [
  { id: 'thumb', name: 'Thumb', color: '#f59e0b', defaultExt: 15.34, defaultFlex: 85.97, maxPressure: 140 },
  { id: 'index', name: 'Index', color: '#06b6d4', defaultExt: 16.12, defaultFlex: 92.45, maxPressure: 150 },
  { id: 'middle', name: 'Middle', color: '#3b82f6', defaultExt: 16.78, defaultFlex: 94.27, maxPressure: 150 },
  { id: 'ring', name: 'Ring', color: '#a855f7', defaultExt: 15.89, defaultFlex: 89.62, maxPressure: 145 },
  { id: 'pinky', name: 'Pinky', color: '#ec4899', defaultExt: 15.45, defaultFlex: 87.31, maxPressure: 135 },
];

export const GESTURES = [
  {
    id: 'fist',
    name: 'Full Fist Closure',
    category: 'Functional',
    description: 'All fingers flexed into a tight fist for full grip strength rehabilitation.',
    targets: { thumb: 86, index: 92, middle: 94, ring: 90, pinky: 87 },
    icon: '✊'
  },
  {
    id: 'open_palm',
    name: 'Open Palm (Extension)',
    category: 'Functional',
    description: 'Full extension of all digits to restore extensor tone and stretch flexors.',
    targets: { thumb: 15, index: 16, middle: 17, ring: 16, pinky: 15 },
    icon: '✋'
  },
  {
    id: 'pinch',
    name: 'Two-Finger Pinch',
    category: 'Functional',
    description: 'Thumb and index fingertip opposition for precision grasping.',
    targets: { thumb: 75, index: 85, middle: 20, ring: 18, pinky: 16 },
    icon: '🤏'
  },
  {
    id: 'tripod',
    name: 'Three-Finger Tripod Pinch',
    category: 'Functional',
    description: 'Thumb, index, and middle finger coordinated pinch (writing/eating grip).',
    targets: { thumb: 75, index: 80, middle: 80, ring: 18, pinky: 16 },
    icon: '👌'
  },
  {
    id: 'ok',
    name: 'OK Sign',
    category: 'Gesture',
    description: 'Thumb and index form a circle, middle, ring, and pinky extended straight.',
    targets: { thumb: 80, index: 88, middle: 17, ring: 16, pinky: 15 },
    icon: '👌'
  },
  {
    id: 'victor',
    name: 'VICTOR (Peace Sign)',
    category: 'Gesture',
    description: 'Index and middle fingers extended in a V-shape, others fully flexed.',
    targets: { thumb: 82, index: 16, middle: 17, ring: 89, pinky: 86 },
    icon: '✌️'
  },
  {
    id: 'thumbs_up',
    name: 'Thumbs Up',
    category: 'Gesture',
    description: 'Thumb extended upwards, remaining four digits flexed into a fist.',
    targets: { thumb: 15, index: 92, middle: 94, ring: 90, pinky: 87 },
    icon: '👍'
  },
  {
    id: 'point',
    name: 'Pointing (Index)',
    category: 'Gesture',
    description: 'Index extended, thumb locking down middle, ring, and pinky.',
    targets: { thumb: 80, index: 16, middle: 93, ring: 89, pinky: 87 },
    icon: '👉'
  },
  {
    id: 'rock',
    name: 'Rock / Horns',
    category: 'Gesture',
    description: 'Index and pinky extended, middle and ring held by thumb.',
    targets: { thumb: 80, index: 16, middle: 94, ring: 90, pinky: 15 },
    icon: '🤘'
  },
  {
    id: 'call_me',
    name: 'Call Me (Shaka)',
    category: 'Gesture',
    description: 'Thumb and pinky extended outwards, middle three digits flexed.',
    targets: { thumb: 15, index: 92, middle: 94, ring: 90, pinky: 15 },
    icon: '🤙'
  },
  {
    id: 'gun_l',
    name: 'L-Shape / Gun',
    category: 'Gesture',
    description: 'Thumb and index extended at 90 degrees, others flexed.',
    targets: { thumb: 15, index: 16, middle: 94, ring: 90, pinky: 87 },
    icon: '👆'
  },
  {
    id: 'count_four',
    name: 'Count 4',
    category: 'Gesture',
    description: 'Four fingers extended, thumb folded across the palm.',
    targets: { thumb: 85, index: 16, middle: 17, ring: 16, pinky: 15 },
    icon: '4️⃣'
  },
  {
    id: 'count_three',
    name: 'Count 3',
    category: 'Gesture',
    description: 'Thumb, index, and middle extended, ring and pinky flexed.',
    targets: { thumb: 15, index: 16, middle: 17, ring: 90, pinky: 87 },
    icon: '3️⃣'
  }
];

export const SAFETY_CONFIG = {
  maxAllowedError: 6.5, // ±6.5° threshold limit from study
  targetSD: 3.0,        // Standard deviation < 3°
  maxPressureLimitKPa: 160, // Maximum safe pneumatic pressure
  emergencyReliefHoldMs: 1500,
  defaultCycleCPM: 6    // 6 cycles per minute from study
};
