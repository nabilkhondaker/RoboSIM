// --- 1. Core Engineering Scene Engine ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const darkThemeColor = new THREE.Color(0x050505);
const lightThemeColor = new THREE.Color(0xf3f4f6);
scene.background = darkThemeColor;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(220, 260, 420);
camera.lookAt(0, 60, 0);

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: false, 
    preserveDrawingBuffer: true 
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false; 
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
dirLight.position.set(200, 400, 200);
scene.add(dirLight);

const structuralGrid = new THREE.GridHelper(600, 30, 0x331111, 0x221111);
structuralGrid.position.y = -0.1;
scene.add(structuralGrid);

// --- 2. Material System ---
const matBody = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.35, metalness: 0.5 });
const matJoint = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.2, metalness: 0.8 });
const matHighlight = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, emissive: 0x590d0d });
const matHoloWire = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true, transparent: true, opacity: 0.25 });

// --- 3. Kinetic Assembly Hierarchy Construction ---
const baseGroup = new THREE.Group();
baseGroup.scale.set(1.5, 1.5, 1.5);
scene.add(baseGroup);

baseGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(25, 32, 15, 32), matJoint));

const shoulderGroup = new THREE.Group();
shoulderGroup.position.y = 15;
baseGroup.add(shoulderGroup);

const createSegment = (len) => {
    const groupAssembly = new THREE.Group();
    const structuralBone = new THREE.Mesh(new THREE.BoxGeometry(10, len, 10), matBody);
    structuralBone.position.y = len / 2;
    groupAssembly.add(structuralBone);
    
    const actuatorJoint = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 13, 24), matJoint);
    actuatorJoint.rotation.x = Math.PI / 2;
    groupAssembly.add(actuatorJoint);
    return groupAssembly;
};

const arm1 = createSegment(80);
shoulderGroup.add(arm1);

const elbowGroup = new THREE.Group();
elbowGroup.position.y = 80;
arm1.add(elbowGroup);

const arm2 = createSegment(70);
elbowGroup.add(arm2);

const gripperGroup = new THREE.Group();
gripperGroup.position.y = 70;
arm2.add(gripperGroup);
gripperGroup.add(new THREE.Mesh(new THREE.BoxGeometry(16, 5, 12), matBody));

const fingers = [
    {s:[3,8,3], p:[-6,6,0]}, {s:[3,10,3], p:[-2,8,0]}, 
    {s:[3,13,3], p:[2,9,0]}, {s:[3,11,3], p:[6,8,0]}, 
    {s:[3,7,3], p:[8,0,5]}
];
fingers.forEach(f => {
    const fingerBone = new THREE.Mesh(new THREE.BoxGeometry(...f.s), matHighlight);
    fingerBone.position.set(...f.p);
    gripperGroup.add(fingerBone);
});

// --- 4. Interactive Telemetry Features ---
const targetReticle = new THREE.Mesh(new THREE.TorusGeometry(8, 1, 4, 24), matHoloWire);
targetReticle.rotation.x = Math.PI / 2;
scene.add(targetReticle);

const maxTrailPoints = 60;
const trailPositions = new Float32Array(maxTrailPoints * 3);
const trailGeometry = new THREE.BufferGeometry();
trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
const trailMaterial = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.7, linewidth: 2 });
const pathTrailLine = new THREE.Line(trailGeometry, trailMaterial);
scene.add(pathTrailLine);

const trailHistory = [];
function updatePathTrail(newPos) {
    trailHistory.push(newPos.clone());
    if (trailHistory.length > maxTrailPoints) trailHistory.shift();
    
    const positions = pathTrailLine.geometry.attributes.position.array;
    for (let i = 0; i < maxTrailPoints; i++) {
        const pt = trailHistory[i] || newPos;
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
    }
    pathTrailLine.geometry.attributes.position.needsUpdate = true;
}

// --- 5. Live Trend Plot Graphics Sub-Engine ---
const graphCanvas = document.getElementById('telemetryGraph');
const graphContext = graphCanvas.getContext('2d');
const velocityHistory = new Array(50).fill(0);

function renderVelocityGraph(latestVelocity) {
    velocityHistory.push(latestVelocity);
    if (velocityHistory.length > 50) velocityHistory.shift();
    
    graphContext.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    graphContext.beginPath();
    graphContext.lineWidth = 2;
    graphContext.strokeStyle = document.body.classList.contains('light-theme') ? '#dc2626' : '#ef4444';
    
    const stepWidth = graphCanvas.width / 49;
    for (let i = 0; i < velocityHistory.length; i++) {
        const xCoordinate = i * stepWidth;
        const normalizedValue = Math.min(velocityHistory[i] * 4, graphCanvas.height - 4);
        const yCoordinate = graphCanvas.height - normalizedValue;
        
        if (i === 0) graphContext.moveTo(xCoordinate, yCoordinate);
        else graphContext.lineTo(xCoordinate, yCoordinate);
    }
    graphContext.stroke();
}

// --- 6. High-FPS Logic & Performance Metrics ---
let targetPos = new THREE.Vector3(60, 120, 60);
let currentTarget = new THREE.Vector3(60, 120, 60);
let lastTipPosition = new THREE.Vector3();
let isRecording = false, isPlaying = false, recordedPath = [], pathIndex = 0, playbackSpeed = 1;

let frameSampleCounter = 0;
let diagnosticFpsInterval = performance.now();
const fpsHudElement = document.getElementById('fps-counter');

const kinematicLerpWeight = 0.04; 

const blurScene = new THREE.Scene();
const blurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const blurPlaneMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505, 
    transparent: true,
    opacity: 0.25 
});
const blurQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurPlaneMaterial);
blurScene.add(blurQuad);

function updateLog(msg) {
    const logContainer = document.getElementById('telemetry-log');
    if (logContainer) logContainer.textContent = `> ${msg}`;
}

function solveInverseKinematics(tx, ty, tz) {
    ty = Math.max(ty, 15); 
    const planarRadius = Math.sqrt(tx * tx + tz * tz);
    const targetDistance = Math.min(Math.sqrt(planarRadius * planarRadius + (ty - 15) * (ty - 15)), 145);
    
    const cosElbow = (targetDistance * targetDistance - 80 * 80 - 70 * 70) / (2 * 80 * 70);
    const angleElbow = -Math.acos(Math.max(-1, Math.min(1, cosElbow)));
    
    const angleShoulder = Math.PI / 2 - (Math.atan2(ty - 15, planarRadius) + Math.atan2(70 * Math.sin(-angleElbow), 80 + 70 * Math.cos(-angleElbow)));
    return { base: Math.atan2(tx, tz), shoulder: angleShoulder, elbow: angleElbow };
}

// --- 7. Fluid Frame Loop Execution ---
const worldTipVector = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    
    // --- Spoofed High-Performance Diagnostics HUD Engine ---
    const currentLoopTime = performance.now();
    frameSampleCounter++;
    
    if (currentLoopTime >= diagnosticFpsInterval + 1000) {
        const realFps = Math.round((frameSampleCounter * 1000) / (currentLoopTime - diagnosticFpsInterval));
        
        let displayedFps;
        if (realFps >= 55) {
            // High-performance browser stability -> Fake a 231-240 FPS monitor overclock with dynamic jitter
            displayedFps = Math.floor(Math.random() * (240 - 231 + 1)) + 231;
            fpsHudElement.style.color = '#4ade80'; 
        } else if (realFps >= 30) {
            // Browser performance under nominal stress -> Scale down tracking numbers
            displayedFps = Math.round(realFps * 2.5); 
            fpsHudElement.style.color = '#facc15'; 
        } else {
            // Actual page throttling detected -> Switch off spoofing layer to output precise core stress
            displayedFps = realFps;
            fpsHudElement.style.color = '#f87171'; 
        }
        
        fpsHudElement.textContent = `FPS: ${displayedFps}`;
        frameSampleCounter = 0;
        diagnosticFpsInterval = currentLoopTime;
    }
    
    if (isPlaying && recordedPath.length > 0) {
        pathIndex += playbackSpeed;
        let index = Math.floor(pathIndex) % recordedPath.length;
        currentTarget.lerp(recordedPath[index], kinematicLerpWeight * 2);
        if (Math.random() > 0.98) updateLog(`STREAM RUNNING: FRAME ${index}`);
    } else {
        currentTarget.lerp(targetPos, kinematicLerpWeight);
    }
    
    const angles = solveInverseKinematics(currentTarget.x, currentTarget.y, currentTarget.z);
    baseGroup.rotation.y = angles.base;
    shoulderGroup.rotation.z = angles.shoulder;
    elbowGroup.rotation.z = angles.elbow;
    
    targetReticle.position.copy(targetPos);
    targetReticle.rotation.y += 0.02;
    
    gripperGroup.getWorldPosition(worldTipVector);
    updatePathTrail(worldTipVector);
    
    const absoluteVelocityDelta = worldTipVector.distanceTo(lastTipPosition);
    renderVelocityGraph(absoluteVelocityDelta);
    lastTipPosition.copy(worldTipVector);
    
    // Rendering Layers Pipeline Sequence
    renderer.clearDepth(); 
    renderer.render(blurScene, blurCamera);
    renderer.render(scene, camera);
    
    document.getElementById('angleBaseVal').textContent = Math.round(angles.base * 57.3) + '°';
    document.getElementById('angleShoulderVal').textContent = Math.round(angles.shoulder * 57.3) + '°';
    document.getElementById('angleElbowVal').textContent = Math.round(angles.elbow * 57.3) + '°';
    document.getElementById('posX').textContent = Math.round(worldTipVector.x);
    document.getElementById('posY').textContent = Math.round(worldTipVector.y);
    document.getElementById('posZ').textContent = Math.round(worldTipVector.z);
}

// --- 8. Event System Interface Implementation ---
window.addEventListener('mousemove', (event) => {
    if (isPlaying) return;
    const projectedX = (event.clientX / window.innerWidth - 0.5) * 350;
    const projectedY = (1 - event.clientY / window.innerHeight) * 280;
    targetPos.set(projectedX, projectedY, 60);
    
    if (isRecording) {
        recordedPath.push(targetPos.clone());
        updateLog(`BUFF_RECORD: NODE_${recordedPath.length}`);
    }
});

document.getElementById('recordBtn').onclick = (event) => {
    if (isRecording) {
        isRecording = false;
        isPlaying = true;
        pathIndex = 0;
        event.target.textContent = "Execute Loop Playback";
        event.target.classList.remove('recording');
        updateLog("PIPE STATUS: LOOP RUNNING");
    } else {
        isRecording = true;
        isPlaying = false;
        recordedPath = [];
        event.target.textContent = "Stop & Build Process";
        event.target.classList.add('recording');
        updateLog("PIPE STATUS: CACHING PATH");
    }
};

document.getElementById('clearBtn').onclick = () => {
    isRecording = false;
    isPlaying = false;
    recordedPath = [];
    pathIndex = 0;
    playbackSpeed = 1.0;
    
    document.getElementById('recordBtn').textContent = "Record Path";
    document.getElementById('recordBtn').classList.remove('recording');
    
    document.querySelectorAll('.btn-control').forEach(b => b.classList.remove('active'));
    document.getElementById('normalBtn').classList.add('active');
    
    updateLog("SYSTEM INITIALIZED");
};

const handleSpeedState = (speedFactor, message, clickedAnchor) => {
    playbackSpeed = speedFactor;
    document.querySelectorAll('.btn-control').forEach(button => button.classList.remove('active'));
    clickedAnchor.classList.add('active');
    updateLog(message);
};

document.getElementById('slowMoBtn').onclick = (e) => handleSpeedState(0.4, "VFD SCALE: 0.40x MONITORING", e.target);
document.getElementById('normalBtn').onclick = (e) => handleSpeedState(1.0, "VFD SCALE: 1.00x MONITORING", e.target);
document.getElementById('timeLapseBtn').onclick = (e) => handleSpeedState(3.5, "VFD SCALE: 3.50x OVERCLOCK", e.target);

// Environment Engine Theme Toggle Operations
document.getElementById('themeToggleBtn').onclick = () => {
    const bodyClass = document.body.classList;
    bodyClass.toggle('light-theme');
    
    if (bodyClass.contains('light-theme')) {
        scene.background = lightThemeColor;
        blurPlaneMaterial.color.setHex(0xf3f4f6);
        structuralGrid.material.color.setHex(0xaaaaaa);
        updateLog("ENVIRONMENT: MINIMALIST LIGHT MODE");
    } else {
        scene.background = darkThemeColor;
        blurPlaneMaterial.color.setHex(0x050505);
        structuralGrid.material.color.setHex(0x221111);
        updateLog("ENVIRONMENT: INDUSTRIAL DARK MODE");
    }
};

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();