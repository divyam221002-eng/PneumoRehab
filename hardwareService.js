// Web Serial API and Pneumatic Simulation Service

class HardwareService {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.isSimulating = false; // Default to UNPAIRED / DISCONNECTED
    this.telemetryCallback = null;
    this.safetyCallback = null;
    this.statusCallback = null;

    // Simulation internal state
    this.simTimer = null;
    this.simState = {
      angles: [15.0, 15.0, 15.0, 15.0, 15.0], // Nominal resting angles (°)
      targetAngles: [15.0, 15.0, 15.0, 15.0, 15.0],
      pressures: [0, 0, 0, 0, 0], // Current branch pressures (kPa)
      targetPressures: [0, 0, 0, 0, 0],
      palmAngle: 18.0, // Ankle/Wrist sensor for palm angular movement (-30° to +60°)
      targetPalmAngle: 18.0,
      reliefValveOpen: false,
      emergencyStop: false,
      batteryVoltage: null, // NULL when device is unpaired!
      timestamp: Date.now()
    };

    // User-defined safety limits (min extension, max flexion)
    this.safetyThresholds = {
      thumb: { min: 12, max: 92 },
      index: { min: 12, max: 96 },
      middle: { min: 12, max: 98 },
      ring: { min: 12, max: 94 },
      pinky: { min: 12, max: 92 }
    };

    this.fingerKeys = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    // Do NOT auto-start simulation; starts in UNPAIRED state!
  }

  onTelemetry(cb) {
    this.telemetryCallback = cb;
  }

  onSafetyAlert(cb) {
    this.safetyCallback = cb;
  }

  onStatusChange(cb) {
    this.statusCallback = cb;
  }

  setSafetyThresholds(thresholds) {
    this.safetyThresholds = { ...this.safetyThresholds, ...thresholds };
    if (this.isConnected) {
      this.sendCommand(`CMD:SET_THRESH:${JSON.stringify(this.safetyThresholds)}`);
    }
  }

  // Web Serial API Connection
  // Start Virtual Glove Simulator
  startSimulationMode() {
    this.isConnected = false;
    this.isSimulating = true;
    this.simState.batteryVoltage = 12.2;
    this.startSimulation();
    if (this.statusCallback) {
      this.statusCallback({ connected: false, simulating: true, port: 'Virtual Simulator' });
    }
  }

  // Stop Simulation and return to Unpaired state
  stopSimulationMode() {
    this.stopSimulation();
    this.isSimulating = false;
    this.simState.batteryVoltage = null;
    if (this.statusCallback) {
      this.statusCallback({ connected: false, simulating: false, port: null });
    }
    if (this.telemetryCallback) {
      this.telemetryCallback({
        angles: [15.0, 15.0, 15.0, 15.0, 15.0],
        targetAngles: [15.0, 15.0, 15.0, 15.0, 15.0],
        pressures: [0, 0, 0, 0, 0],
        targetPressures: [0, 0, 0, 0, 0],
        relief: false,
        emergencyStop: false,
        palmAngle: 15.0,
        battery: null, // null when unpaired!
        timestamp: Date.now()
      });
    }
  }

  // Web Serial API Connection
  async connectSerial() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome, Edge, or Opera.');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });

      this.isConnected = true;
      this.isSimulating = false;
      this.simState.batteryVoltage = 12.2; // default nominal Li-ion
      this.stopSimulation();

      if (this.statusCallback) {
        this.statusCallback({ connected: true, simulating: false, port: 'Serial COM' });
      }

      this.startSerialReadLoop();
      return true;
    } catch (err) {
      console.error('Serial connection error:', err);
      throw err;
    }
  }

  async disconnectSerial() {
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {}
      this.reader = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {}
      this.port = null;
    }
    this.isConnected = false;
    this.isSimulating = false;
    this.simState.batteryVoltage = null;
    this.stopSimulation();

    if (this.statusCallback) {
      this.statusCallback({ connected: false, simulating: false, port: null });
    }

    if (this.telemetryCallback) {
      this.telemetryCallback({
        angles: [15.0, 15.0, 15.0, 15.0, 15.0],
        targetAngles: [15.0, 15.0, 15.0, 15.0, 15.0],
        pressures: [0, 0, 0, 0, 0],
        targetPressures: [0, 0, 0, 0, 0],
        relief: false,
        emergencyStop: false,
        battery: null, // null when unpaired!
        timestamp: Date.now()
      });
    }
  }

  async startSerialReadLoop() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep last partial line

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              try {
                const data = JSON.parse(trimmed);
                this.handleIncomingTelemetry(data);
              } catch (e) {
                console.warn('JSON parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Serial read loop error:', error);
    } finally {
      this.reader.releaseLock();
    }
  }

  async sendCommand(cmdString) {
    if (this.isSimulating) {
      this.handleSimulatedCommand(cmdString);
      return;
    }

    if (!this.port || !this.port.writable) return;

    try {
      const textEncoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(textEncoder.encode(cmdString + '\n'));
      writer.releaseLock();
    } catch (err) {
      console.error('Error writing command to serial:', err);
    }
  }

  // Send target angles/pressures to glove
  setFingerTargets(fingerMap) {
    // If not connected to physical serial, automatically engage simulator so commands work immediately
    if (!this.isConnected && !this.isSimulating) {
      this.startSimulationMode();
    }

    if (this.isSimulating) {
      // Clear relief valve when new active command is received
      if (this.simState.reliefValveOpen && !this.simState.emergencyStop) {
        this.simState.reliefValveOpen = false;
      }

      this.fingerKeys.forEach((k, idx) => {
        if (fingerMap[k] !== undefined) {
          const target = Number(fingerMap[k]);
          this.simState.targetAngles[idx] = target;
          // Calibrated pneumatic pressure for target angle (15° = 0 kPa, 95° = 140 kPa)
          const ratio = Math.max(0, Math.min(1, (target - 15) / 80));
          this.simState.targetPressures[idx] = Math.round(ratio * 140);
        }
      });
    } else {
      this.sendCommand(`CMD:TARGETS:${JSON.stringify(fingerMap)}`);
    }
  }

  emergencyStop() {
    this.simState.emergencyStop = true;
    this.simState.reliefValveOpen = true;
    this.simState.targetPressures = [0, 0, 0, 0, 0];
    this.simState.targetAngles = [15.0, 15.0, 15.0, 15.0, 15.0];
    this.sendCommand('CMD:ESTOP');
    if (this.safetyCallback) {
      this.safetyCallback({
        type: 'ESTOP',
        message: 'EMERGENCY STOP ACTIVATED: Pressure relief branch opened, all actuators vented.',
        severity: 'danger'
      });
    }
  }

  resetEmergencyStop() {
    this.simState.emergencyStop = false;
    this.simState.reliefValveOpen = false;
    this.sendCommand('CMD:ESTOP_RESET');
  }

  togglePressureRelief(forceOpen) {
    const newState = forceOpen !== undefined ? forceOpen : !this.simState.reliefValveOpen;
    this.simState.reliefValveOpen = newState;
    if (newState) {
      this.simState.targetPressures = [0, 0, 0, 0, 0];
      this.simState.targetAngles = [15.0, 15.0, 15.0, 15.0, 15.0];
    }
    this.sendCommand(`CMD:RELIEF:${newState ? 'OPEN' : 'CLOSE'}`);
  }

  // Realistic Pneumatic & Sensor Dynamics Simulator
  startSimulation() {
    if (this.simTimer) clearInterval(this.simTimer);

    this.simTimer = setInterval(() => {
      const dt = 0.05; // 50ms (20Hz)
      const state = this.simState;

      for (let i = 0; i < 5; i++) {
        const finger = this.fingerKeys[i];
        const threshold = this.safetyThresholds[finger];

        if (state.reliefValveOpen || state.emergencyStop) {
          // Venting rapidly
          state.pressures[i] = Math.max(0, state.pressures[i] - 220 * dt);
          // Finger relaxes towards resting extension 15°
          state.angles[i] += (15.0 - state.angles[i]) * 6.0 * dt;
        } else {
          // Pressure dynamics: responsive inflation and deflation
          const pDiff = state.targetPressures[i] - state.pressures[i];
          const pumpRate = pDiff > 0 ? 160 : 220; // inflation vs deflation speed (kPa/s)
          state.pressures[i] += Math.sign(pDiff) * Math.min(Math.abs(pDiff), pumpRate * dt);

          // Angle response calibrated to pneumatic pressure
          const targetAngleFromP = 15.0 + (state.pressures[i] / 140) * 80;
          // Sensor noise (dual op-amp conditioned, SD < 0.15°)
          const sensorNoise = (Math.random() - 0.5) * 0.25;
          state.angles[i] += (targetAngleFromP - state.angles[i]) * 6.0 * dt + sensorNoise;

          // Safety Threshold Enforcement Check
          if (threshold) {
            if (state.angles[i] > threshold.max) {
              state.reliefValveOpen = true;
              state.targetPressures[i] = Math.max(0, state.pressures[i] - 30);
              if (this.safetyCallback) {
                this.safetyCallback({
                  type: 'OVERFLEXION_GUARD',
                  finger,
                  angle: state.angles[i].toFixed(1),
                  limit: threshold.max,
                  message: `SAFETY INTERLOCK: ${finger.toUpperCase()} exceeded limit (${state.angles[i].toFixed(1)}° > ${threshold.max}°). Dedicated relief activated!`,
                  severity: 'warning'
                });
              }
            }
          }
        }
      }

      // Ankle/Wrist Sensor: Dynamic calculation of palm angular movement
      // Natural biomechanical synergy: as fingers curl into grasp, palm/wrist naturally extends by ~10°-25°
      const avgFlex = state.angles.reduce((a, b) => a + b, 0) / 5;
      const targetPalm = 12.0 + ((avgFlex - 15) / 80) * 22.0;
      state.palmAngle += (targetPalm - state.palmAngle) * 4.0 * dt + (Math.random() - 0.5) * 0.15;

      // Small battery voltage fluctuation around 12.1V
      state.batteryVoltage = 12.1 + (Math.sin(Date.now() / 10000) * 0.08);
      state.timestamp = Date.now();

      const telemetryData = {
        angles: state.angles.map(a => Number(a.toFixed(2))),
        targetAngles: state.targetAngles.map(a => Number(a.toFixed(2))),
        pressures: state.pressures.map(p => Number(p.toFixed(1))),
        targetPressures: state.targetPressures.map(p => Number(p.toFixed(1))),
        palmAngle: Number(state.palmAngle.toFixed(1)), // Live palm tilt/wrist angle from ankle/wrist sensor
        relief: state.reliefValveOpen,
        emergencyStop: state.emergencyStop,
        battery: Number(state.batteryVoltage.toFixed(2)),
        timestamp: state.timestamp
      };

      if (this.telemetryCallback) {
        this.telemetryCallback(telemetryData);
      }
    }, 50);
  }

  stopSimulation() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  handleSimulatedCommand(cmd) {
    if (cmd.startsWith('CMD:RELIEF:OPEN')) {
      this.simState.reliefValveOpen = true;
    } else if (cmd.startsWith('CMD:RELIEF:CLOSE')) {
      this.simState.reliefValveOpen = false;
    } else if (cmd.startsWith('CMD:ESTOP_RESET')) {
      this.simState.emergencyStop = false;
      this.simState.reliefValveOpen = false;
    }
  }

  handleIncomingTelemetry(data) {
    if (this.telemetryCallback) {
      this.telemetryCallback(data);
    }
  }
}

export const hardwareService = new HardwareService();
