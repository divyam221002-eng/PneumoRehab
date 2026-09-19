import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RotateCcw } from 'lucide-react';

export default function Glove3DVisualizer({
  angles = [15, 16, 17, 16, 15],
  pressures = [0, 0, 0, 0, 0],
  safetyThresholds = {}
}) {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const fingerChainsRef = useRef([]);
  const bellowMeshesRef = useRef([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean bright laboratory canvas

    // 2. Camera Setup
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 70, 190);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 80;
    controls.maxDistance = 350;
    controls.target.set(0, 25, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(60, 120, 80);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.6);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    // 6. Ground Shadow Receiver Plane
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.08 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -35;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle technical grid
    const gridHelper = new THREE.GridHelper(260, 26, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = -34.8;
    scene.add(gridHelper);

    // 7. Materials
    const metalJointMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25
    });

    const palmMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.3,
      roughness: 0.4
    });

    const manifoldMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3
    });

    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.3
    });

    // 8. Sculpted Hand Palm
    const palmGroup = new THREE.Group();
    const palmGeo = new THREE.BoxGeometry(64, 52, 14);
    const palmMesh = new THREE.Mesh(palmGeo, palmMat);
    palmMesh.position.set(0, 0, 0);
    palmMesh.castShadow = true;
    palmMesh.receiveShadow = true;
    palmGroup.add(palmMesh);

    // Pneumatic Manifold Hub on dorsal surface
    const manifoldGeo = new THREE.BoxGeometry(40, 16, 8);
    const manifoldMesh = new THREE.Mesh(manifoldGeo, manifoldMat);
    manifoldMesh.position.set(0, -14, 9);
    manifoldMesh.castShadow = true;
    palmGroup.add(manifoldMesh);

    // 5 Miniature Tube Connectors on Manifold
    for (let i = -2; i <= 2; i++) {
      const fittingGeo = new THREE.CylinderGeometry(1.6, 1.6, 4, 8);
      const fittingMesh = new THREE.Mesh(fittingGeo, metalJointMat);
      fittingMesh.rotation.x = Math.PI / 2;
      fittingMesh.position.set(i * 7, -14, 14);
      palmGroup.add(fittingMesh);
    }

    scene.add(palmGroup);

    // 9. Articulated 5 Digits with Color-Coded Bellows
    const fingerDefs = [
      { id: 'thumb', name: 'Thumb', color: 0xd97706, mcpPos: [-28, -8, 0], mcpRotZ: 0.65, length: 32, segs: [14, 11, 7] },
      { id: 'index', name: 'Index', color: 0x0d9488, mcpPos: [-20, 26, 0], mcpRotZ: 0.08, length: 42, segs: [18, 14, 10] },
      { id: 'middle', name: 'Middle', color: 0x0284c7, mcpPos: [-6, 28, 0], mcpRotZ: 0.0, length: 46, segs: [20, 15, 11] },
      { id: 'ring', name: 'Ring', color: 0x6366f1, mcpPos: [8, 26, 0], mcpRotZ: -0.06, length: 42, segs: [18, 14, 10] },
      { id: 'pinky', name: 'Pinky', color: 0xdb2777, mcpPos: [22, 22, 0], mcpRotZ: -0.16, length: 34, segs: [15, 11, 8] },
    ];

    const fingerChains = [];
    const bellowMeshes = [];

    fingerDefs.forEach((def) => {
      const [pLen, mLen, dLen] = def.segs;

      // Finger Base / MCP Joint Group
      const mcpGroup = new THREE.Group();
      mcpGroup.position.set(def.mcpPos[0], def.mcpPos[1], def.mcpPos[2]);
      mcpGroup.rotation.z = def.mcpRotZ;
      palmGroup.add(mcpGroup);

      // MCP Joint Bearing Sphere
      const mcpSphere = new THREE.Mesh(new THREE.SphereGeometry(3.8, 12, 12), metalJointMat);
      mcpSphere.castShadow = true;
      mcpGroup.add(mcpSphere);

      // Proximal Phalanx
      const proxPhalanx = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.4, pLen, 10), boneMat);
      proxPhalanx.position.set(0, pLen / 2, 0);
      proxPhalanx.castShadow = true;
      mcpGroup.add(proxPhalanx);

      // Proximal Bellows (Pneumatic chambers)
      const bellowMat = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.35,
        metalness: 0.2,
        transparent: true,
        opacity: 0.88
      });

      const proxBellows = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, pLen - 2, 12), bellowMat);
      proxBellows.position.set(0, pLen / 2, 3.5);
      proxBellows.castShadow = true;
      mcpGroup.add(proxBellows);

      // PIP Joint Group
      const pipGroup = new THREE.Group();
      pipGroup.position.set(0, pLen, 0);
      mcpGroup.add(pipGroup);

      const pipSphere = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 12), metalJointMat);
      pipSphere.castShadow = true;
      pipGroup.add(pipSphere);

      // Intermediate Phalanx
      const midPhalanx = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, mLen, 10), boneMat);
      midPhalanx.position.set(0, mLen / 2, 0);
      midPhalanx.castShadow = true;
      pipGroup.add(midPhalanx);

      // Intermediate Bellows
      const midBellows = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, mLen - 2, 12), bellowMat);
      midBellows.position.set(0, mLen / 2, 3.2);
      midBellows.castShadow = true;
      pipGroup.add(midBellows);

      // DIP Joint Group
      const dipGroup = new THREE.Group();
      dipGroup.position.set(0, mLen, 0);
      pipGroup.add(dipGroup);

      const dipSphere = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 12), metalJointMat);
      dipSphere.castShadow = true;
      dipGroup.add(dipSphere);

      // Distal Phalanx & Fingertip
      const distPhalanx = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, dLen, 10), boneMat);
      distPhalanx.position.set(0, dLen / 2, 0);
      distPhalanx.castShadow = true;
      dipGroup.add(distPhalanx);

      const tipCap = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10), metalJointMat);
      tipCap.position.set(0, dLen, 0);
      tipCap.castShadow = true;
      dipGroup.add(tipCap);

      // Distal Bellows
      const distBellows = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, dLen - 1, 12), bellowMat);
      distBellows.position.set(0, dLen / 2, 2.8);
      distBellows.castShadow = true;
      dipGroup.add(distBellows);

      fingerChains.push({
        id: def.id,
        mcp: mcpGroup,
        pip: pipGroup,
        dip: dipGroup,
        currentAngle: 15,
        targetAngle: 15,
        currentPressure: 0,
        targetPressure: 0
      });

      bellowMeshes.push({
        prox: proxBellows,
        mid: midBellows,
        dist: distBellows,
        material: bellowMat
      });
    });

    fingerChainsRef.current = fingerChains;
    bellowMeshesRef.current = bellowMeshes;

    // 10. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.autoRotateSpeed = 1.5;
        controlsRef.current.update();
      }

      // Smooth kinematic interpolation
      fingerChainsRef.current.forEach((chain, idx) => {
        chain.currentAngle += (chain.targetAngle - chain.currentAngle) * 0.16;
        chain.currentPressure += (chain.targetPressure - chain.currentPressure) * 0.16;

        // Bending kinematics (15° rest to 95° full flex)
        const flexRad = Math.max(0, (chain.currentAngle - 15) * (Math.PI / 180));

        // Distribution: MCP 45%, PIP 35%, DIP 20%
        chain.mcp.rotation.x = -flexRad * 0.45;
        chain.pip.rotation.x = -flexRad * 0.35;
        chain.dip.rotation.x = -flexRad * 0.20;

        // Pneumatic bellow expansion with pressure
        const pRatio = Math.min(1, Math.max(0, chain.currentPressure / 140));
        const bellowExpansion = 1 + pRatio * 0.42;

        const bellows = bellowMeshesRef.current[idx];
        if (bellows) {
          bellows.prox.scale.set(bellowExpansion, 1, bellowExpansion);
          bellows.mid.scale.set(bellowExpansion, 1, bellowExpansion);
          bellows.dist.scale.set(bellowExpansion, 1, bellowExpansion);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 11. Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update target angles and pressures in real time
  useEffect(() => {
    fingerChainsRef.current.forEach((chain, idx) => {
      chain.targetAngle = angles[idx] !== undefined ? angles[idx] : 15;
      chain.targetPressure = pressures[idx] !== undefined ? pressures[idx] : 0;
    });
  }, [angles, pressures]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 70, 190);
      controlsRef.current.target.set(0, 25, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full min-h-[350px] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Navigation Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 border border-slate-200 p-1 rounded-lg shadow-xs backdrop-blur-xs">
        <button
          onClick={() => setAutoRotate(prev => !prev)}
          className={`p-1.5 rounded transition ${
            autoRotate ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={autoRotate ? 'Stop auto-rotation' : 'Enable auto-rotation'}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="Reset 3D camera view"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3D Interaction Tip & Telemetry Badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 pointer-events-none">
        <div className="bg-white/90 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-mono text-slate-600 shadow-xs backdrop-blur-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>3D WebGL: Real-Time Joint Kinematics</span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
          Drag to rotate • Scroll to zoom
        </span>
      </div>
    </div>
  );
}
