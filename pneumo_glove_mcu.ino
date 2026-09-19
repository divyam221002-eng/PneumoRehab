/*
 * PneumoGlove Pro - Microcontroller Firmware (ESP32 / Arduino / STM32)
 *
 * Coordinates:
 * - 5 Flexible Bending Sensors (Dual Op-Amp conditioned ADC inputs: A0-A4)
 * - 5 Independent Pneumatic Branches (Micro air pumps + Solenoid valves: PWM/Digital pins)
 * - 1 Dedicated Pressure-Relief Branch (Normally Closed valve: Venting pin)
 * - 12V Li-ion Battery Voltage Monitor (ADC A5)
 * - High-speed serial protocol (115200 baud, JSON telemetry @ 20Hz)
 */

#include <Arduino.h>

// Pin Definitions
const int SENSOR_PINS[5]   = {A0, A1, A2, A3, A4};  // Thumb, Index, Middle, Ring, Pinky
const int PUMP_PINS[5]     = {3, 5, 6, 9, 10};      // Micro air pumps (PWM)
const int VALVE_PINS[5]    = {2, 4, 7, 8, 12};      // 3-way solenoid valves
const int RELIEF_PIN       = 11;                    // Dedicated pressure relief valve
const int BATTERY_PIN      = A5;                    // 12V Battery divider input

// Safety limits
const float MAX_FLEXION_DEFAULT = 95.0; // deg
const float MIN_EXT_DEFAULT     = 15.0; // deg

float currentAngles[5]   = {15.5, 16.0, 16.5, 16.0, 15.5};
float targetAngles[5]    = {15.5, 16.0, 16.5, 16.0, 15.5};
float currentPressure[5] = {0, 0, 0, 0, 0};
bool reliefOpen          = false;
bool emergencyStop       = false;

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 50; // 20 Hz

void setup() {
  Serial.begin(115200);
  while (!Serial) { delay(10); }

  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT);
    pinMode(PUMP_PINS[i], OUTPUT);
    pinMode(VALVE_PINS[i], OUTPUT);
    analogWrite(PUMP_PINS[i], 0);
    digitalWrite(VALVE_PINS[i], LOW);
  }

  pinMode(RELIEF_PIN, OUTPUT);
  pinMode(BATTERY_PIN, INPUT);
  digitalWrite(RELIEF_PIN, LOW); // Closed by default
}

// Convert ADC reading from dual op-amp signal conditioning to angle in degrees
float readAngle(int pinIndex) {
  int rawADC = analogRead(SENSOR_PINS[pinIndex]);
  // Calibration mapping: adjust slope/intercept based on specific sensor
  // e.g., 200 ADC = 15° (extension), 850 ADC = 95° (flexion)
  float angle = 15.0 + ((float)(rawADC - 200) / (850 - 200)) * 80.0;
  if (angle < 0) angle = 0;
  if (angle > 120) angle = 120;
  return angle;
}

float readBatteryVoltage() {
  int rawADC = analogRead(BATTERY_PIN);
  // Voltage divider (e.g. 100k / 20k) for 12V Li-ion pack
  return (rawADC / 1023.0) * 5.0 * (120.0 / 20.0);
}

void parseCommand(String cmd) {
  cmd.trim();
  if (cmd.startsWith("CMD:ESTOP")) {
    emergencyStop = true;
    reliefOpen = true;
    digitalWrite(RELIEF_PIN, HIGH); // Open relief
    for (int i = 0; i < 5; i++) {
      analogWrite(PUMP_PINS[i], 0);
      digitalWrite(VALVE_PINS[i], LOW);
    }
  } else if (cmd.startsWith("CMD:ESTOP_RESET")) {
    emergencyStop = false;
    reliefOpen = false;
    digitalWrite(RELIEF_PIN, LOW);
  } else if (cmd.startsWith("CMD:RELIEF:OPEN")) {
    reliefOpen = true;
    digitalWrite(RELIEF_PIN, HIGH);
  } else if (cmd.startsWith("CMD:RELIEF:CLOSE")) {
    reliefOpen = false;
    digitalWrite(RELIEF_PIN, LOW);
  }
}

void loop() {
  // 1. Process incoming commands from Web Serial interface
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    parseCommand(line);
  }

  // 2. Read sensors & perform closed-loop threshold verification
  for (int i = 0; i < 5; i++) {
    currentAngles[i] = readAngle(i);

    // Safety Interlock: if any finger exceeds maximum safe threshold, vent relief branch!
    if (currentAngles[i] > MAX_FLEXION_DEFAULT && !reliefOpen) {
      reliefOpen = true;
      digitalWrite(RELIEF_PIN, HIGH);
    }
  }

  // 3. Emit real-time JSON telemetry stream at 20 Hz
  unsigned long now = millis();
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;

    Serial.print("{\"angles\":[");
    for (int i = 0; i < 5; i++) {
      Serial.print(currentAngles[i], 2);
      if (i < 4) Serial.print(",");
    }
    Serial.print("],\"pressures\":[");
    for (int i = 0; i < 5; i++) {
      Serial.print(currentPressure[i], 1);
      if (i < 4) Serial.print(",");
    }
    Serial.print("],\"relief\":");
    Serial.print(reliefOpen ? "true" : "false");
    Serial.print(",\"emergencyStop\":");
    Serial.print(emergencyStop ? "true" : "false");
    Serial.print(",\"battery\":");
    Serial.print(readBatteryVoltage(), 2);
    Serial.print(",\"timestamp\":");
    Serial.print(now);
    Serial.println("}");
  }
}
