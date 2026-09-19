// Test All Features of Pneumatic Glove Rehab Workstation
import { hardwareService } from '../src/services/hardwareService.js';
import { storageService } from '../src/services/storageService.js';
import { FINGERS, GESTURES, SAFETY_CONFIG } from '../src/constants/gestures.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE REHAB WORKSTATION TESTS');
  console.log('====================================================\n');

  // TEST SUITE 1: Constants & Definitions
  console.log('📋 Suite 1: Constants & Configurations');
  assert(FINGERS.length === 5, '5 anatomical digits configured (Thumb, Index, Middle, Ring, Pinky)');
  assert(GESTURES.length === 13, '13 clinical gesture patterns configured');
  assert(SAFETY_CONFIG.maxAllowedError === 6.5, 'Safety error limit is strictly ±6.5° per study');
  assert(SAFETY_CONFIG.defaultCycleCPM === 6, 'Default cadence is 6 CPM');

  // TEST SUITE 2: Storage Service (Persistence)
  console.log('\n💾 Suite 2: Storage Service Persistence');
  // Mock localStorage for node environment
  const mockStorage = {};
  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
  };

  const initialPatient = storageService.getPatient();
  assert(initialPatient !== null && initialPatient.name === 'Eleanor Vance', 'Default patient profile loaded');

  const initialSessions = storageService.getSessions();
  assert(Array.isArray(initialSessions) && initialSessions.length > 0, 'Seed rehabilitation session logs present');

  const newSession = {
    mode: 'Fine Training',
    finger: 'INDEX',
    cycles: 10,
    cpm: 6,
    achievedFlex: 90,
    timestamp: '12:00:00 PM'
  };
  const updatedSessions = storageService.saveSession(newSession);
  assert(updatedSessions.length === initialSessions.length + 1, 'New session saved to history');

  const openAssessments = storageService.getOpenAssessments();
  assert(Array.isArray(openAssessments) && openAssessments.length > 0, 'Hand opening assessment trials present');

  const recordedTrial = storageService.recordOpenAssessment([16, 17, 18, 17, 16]);
  assert(recordedTrial.length === openAssessments.length + 1, 'New hand opening trial recorded with improvement delta');

  // TEST SUITE 3: Hardware Service Initial Unpaired State
  console.log('\n🔌 Suite 3: Hardware Service & Connection States');
  assert(hardwareService.isConnected === false, 'Initial state: isConnected = false');
  assert(hardwareService.isSimulating === false, 'Initial state: isSimulating = false');
  assert(hardwareService.simState.batteryVoltage === null, 'Initial state: batteryVoltage = null (unpaired)');

  // TEST SUITE 4: Command Dispatch & Automatic Simulation
  console.log('\n⚡ Suite 4: Command Execution & Kinematic Simulation');
  let receivedTelemetry = null;
  hardwareService.onTelemetry((data) => {
    receivedTelemetry = data;
  });

  // Issue command to move Index finger to 85° and Thumb to 75°
  hardwareService.setFingerTargets({ index: 85, thumb: 75 });
  assert(hardwareService.isSimulating === true, 'setFingerTargets auto-engages simulation when disconnected');
  assert(hardwareService.simState.targetAngles[1] === 85, 'Index target angle set to 85°');
  assert(hardwareService.simState.targetAngles[0] === 75, 'Thumb target angle set to 75°');
  assert(hardwareService.simState.targetPressures[1] > 0, 'Index target pneumatic pressure generated');

  // Wait 350ms for physics simulation loop
  await new Promise(r => setTimeout(r, 350));
  assert(receivedTelemetry !== null, 'Telemetry stream active and emitting at 20 Hz');
  assert(receivedTelemetry.angles[1] > 20, `Index angle moving towards target: current = ${receivedTelemetry.angles[1]}°`);
  assert(receivedTelemetry.pressures[1] > 10, `Index pneumatic pressure increasing: current = ${receivedTelemetry.pressures[1]} kPa`);
  assert(receivedTelemetry.battery !== null, `Simulator battery active: ${receivedTelemetry.battery}V`);

  // TEST SUITE 5: Pressure Relief & Venting
  console.log('\n💨 Suite 5: Pressure Relief & Venting Interlock');
  hardwareService.togglePressureRelief(true);
  assert(hardwareService.simState.reliefValveOpen === true, 'Pressure relief valve opened');
  assert(hardwareService.simState.targetPressures.every(p => p === 0), 'All target pressures vented to 0 kPa');

  await new Promise(r => setTimeout(r, 200));
  assert(receivedTelemetry.relief === true, 'Telemetry reports relief valve OPEN');
  assert(receivedTelemetry.angles[1] < 50, `Index angle relaxing toward 15°: current = ${receivedTelemetry.angles[1]}°`);

  hardwareService.togglePressureRelief(false);
  assert(hardwareService.simState.reliefValveOpen === false, 'Pressure relief valve closed');

  // TEST SUITE 6: Emergency Stop
  console.log('\n🛑 Suite 6: Industrial Emergency Stop (E-STOP)');
  let safetyAlertTriggered = false;
  hardwareService.onSafetyAlert((alert) => {
    if (alert.type === 'ESTOP') safetyAlertTriggered = true;
  });

  hardwareService.emergencyStop();
  assert(hardwareService.simState.emergencyStop === true, 'Emergency stop engaged in simState');
  assert(hardwareService.simState.reliefValveOpen === true, 'Emergency stop opened relief valve');
  assert(safetyAlertTriggered === true, 'Safety alert callback fired for ESTOP');

  hardwareService.resetEmergencyStop();
  assert(hardwareService.simState.emergencyStop === false, 'Emergency stop successfully reset');
  assert(hardwareService.simState.reliefValveOpen === false, 'Relief valve restored to closed state');

  // TEST SUITE 7: Stop Simulation & Return to Unpaired
  console.log('\n🔄 Suite 7: Stop Simulation Mode');
  hardwareService.stopSimulationMode();
  assert(hardwareService.isSimulating === false, 'Simulation stopped: isSimulating = false');
  assert(hardwareService.simState.batteryVoltage === null, 'Battery restored to null for unpaired state');

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
