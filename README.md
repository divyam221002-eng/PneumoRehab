# 🖐️ PneumoGlove Rehab Workstation

A modern, responsive, closed-loop soft robotic rehabilitation workstation for hand and finger therapy, featuring real-time telemetry, 2D/3D hand maps, ankle/wrist palm tilt sensors, and daily practice routines.

---

## 🚀 How to Run on Any Computer (Windows, Mac, or Linux)

### Option 1: Quick Run with Node.js (Recommended)
1. **Install Node.js** (version 18 or higher) from [nodejs.org](https://nodejs.org/).
2. **Extract the ZIP file** to any folder on your computer.
3. Open a terminal (Command Prompt / PowerShell on Windows, or Terminal on Mac/Linux) in that folder.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open your browser to:
   ```
   http://localhost:3000
   ```

---

### Option 2: Run the Production Build Directly
If you downloaded the production package (`pneumatic-glove-rehab-production.zip`), you can serve it with any lightweight web server:

- **Using Node `npx`**:
  ```bash
  npx serve dist -p 3000
  ```
- **Using Python 3**:
  ```bash
  cd dist
  python3 -m http.server 3000
  ```
- **Using VS Code**:
  Install the "Live Server" extension, right-click `dist/index.html` and choose "Open with Live Server".

---

## ⚡ Features
- **Live Hand & Sensor Map:** Real-time 2D blueprint and 3D robotic glove simulation with 5 finger channels (Thumb, Index, Middle, Ring, Pinky).
- **Ankle/Wrist Sensor:** Measures angular palm movement (tilt angle) with biomechanical tenodesis coupling.
- **Waveform Graphs:** 3 live telemetry curves (Finger Bending Angles, Air Cushion Pressure, Palm Tilt) updating at 20 Hz.
- **Hand Opening & Mobility Tracker:** Tests how wide the hand opens, tracks improvement vs. day 1, and provides 1-click quick therapy tasks.
- **Training Modes:**
  - Single Finger Practice
  - Everyday Grips (Fist, Pinch, Cylinder, Key, Tripod)
  - 13 Hand Shapes & Gestures
  - Safety Limits & Air Pressure Protection Console
  - Past Practice Records (with CSV spreadsheet download)
  - Monthly Hand Recovery Comparison

---

## 🔌 Hardware Connection
- Supports Web Serial API in Google Chrome, Microsoft Edge, and Opera.
- Plug your ESP32 or Arduino glove controller via USB and click **CONNECT USB**.
- If no physical glove is connected, click **SIMULATOR** to run complete virtual therapy sessions with full physics and tenodesis modeling.
