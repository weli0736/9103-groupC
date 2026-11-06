// YUANZE: Click to trigger audio, color, breathing, and slow orbiting and rotation. Repeated clicks extend state 3; 10 seconds without a click restores the stone state.
// Keep the entry points used by sketch.js; all state is encapsulated in this file.
// Haocheng: Call YuanzeAudio.setIdle(boolean) to control the shared idle state.
// Use the recordings in music; open the page through Live Server to load audio files.
(() => {
  'use strict';
  const IDLE_TIME = 10000;
  const FADE_SECONDS = 1.5;
  const MAX_VOLUME = 0.8;
  const SOUND_DURATION_SECONDS = 10; // Each click plays 10 seconds of audio; another click can switch sounds sooner.
  const SOUND_FILES = ['music/Singing bowl.mp3', 'music/Chinese kit.mp3', 'music/Wind Chimes.mp3'];
  const DRAGON_SIZE_RATIO = 0.25;
  const DRAGON_GAP_RATIO = 0.02; // Reduce the gap while keeping both dragons equally spaced around the canvas center.
  const DRAGON_MAX_SCALE = 1.10;
  const DRAGON_OUTLINE_COLOR = [25, 20, 15]; // Warm black matching the ink outlines of the waves.
  const outlineCache = new WeakMap();

  // Generate an ink outline from the alpha silhouette, using the same method for animated meshes and static images.
  function drawDragonOutline(source, x, y, w, h) {
    let outlineCanvas = outlineCache.get(source);
    if (!outlineCanvas) {
      outlineCanvas = document.createElement('canvas');
      outlineCanvas.width = source.width;
      outlineCanvas.height = source.height;
    const ink = outlineCanvas.getContext('2d');
    ink.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
    ink.drawImage(source, 0, 0);
    // Remove residual background alpha values of about 4-5 from the original PNG to prevent a rectangular ink backdrop.
    const silhouette = ink.getImageData(0, 0, outlineCanvas.width, outlineCanvas.height);
    for (let i = 0; i < silhouette.data.length; i += 4) {
      silhouette.data[i] = DRAGON_OUTLINE_COLOR[0];
      silhouette.data[i + 1] = DRAGON_OUTLINE_COLOR[1];
      silhouette.data[i + 2] = DRAGON_OUTLINE_COLOR[2];
      const alpha = silhouette.data[i + 3];
      silhouette.data[i + 3] = alpha <= 24 ? 0 : Math.round((alpha - 24) * 255 / 231);
    }
    ink.putImageData(silhouette, 0, 0);
      outlineCache.set(source, outlineCanvas);
    }
    const lineWidth = Math.max(1.2, Math.min(2.4, width * 0.002));
    drawingContext.save();
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI * 2 / 16;
      drawingContext.drawImage(outlineCanvas,
        x + Math.cos(angle) * lineWidth, y + Math.sin(angle) * lineWidth, w, h);
    }
    drawingContext.restore();
  }
  const DRAGON_RMS_MAX = 0.20;
  const DRAGON_MOTION_TIME = 10000; // Sound 2 animates for 10 seconds; state 3 uses a separate click timer.
  const DRAGON_ROTATION_SPEED = 0.12; // Radians per second; orbit and spin share the same speed, completing one turn in about 52 seconds.
  const PUPPET_MAX_BEND = 0.055; // Base bending amplitude; increase this value for more pronounced movement.
  const PUPPET_BREATH_STRENGTH = 0.8; // Sound 2: bending strength during the breathing phase.
  const PUPPET_ROTATION_STRENGTH = 1.3; // Sound 3: stronger bending during the rotation phase.
  const WING_MAX_SWING = 0.32; // Double the angular swing around the wing root, up to about 18 degrees.
  const WING_FLEX = 0.018; // Increase flex by 50% while preserving wingtip contours.
  const PUPPET_VIEW_INSET = 0.72; // Leave room around the edges for large wing and tail movements.
  const PUPPET_COLUMNS = 36; // Use a denser surface mesh for smoother torso bending.
  const PUPPET_ROWS = 44;
  const TORSO_BEND_BOOST = 0.18; // Boost bending by up to 18% at the torso midpoint, tapering smoothly toward both ends.
  const TORSO_MOTION_SCALE = 1.89; // Reduce the previous 2.7 multiplier by 30% (2.7 * 0.7).
  // Continuous torso centerlines traced from the user's red paths: 56 evenly spaced arc-length points per dragon.
  // Use normalized coordinates from the original images; the left path is converted back to its unflipped orientation.
  // Right-dragon points B28-B56 follow the revised red line along the torso and tail centerline.
  const DRAGON_TORSO_PATHS = {"left":[[0.44145,0.24088],[0.41212,0.2764],[0.44535,0.31168],[0.48224,0.34363],[0.5071,0.39075],[0.50176,0.44431],[0.46096,0.46689],[0.41752,0.47916],[0.37371,0.4888],[0.33071,0.50357],[0.28859,0.52155],[0.24966,0.54943],[0.21704,0.58835],[0.19993,0.64155],[0.19105,0.69812],[0.19818,0.75419],[0.2278,0.79689],[0.26713,0.82391],[0.30723,0.84851],[0.34912,0.86786],[0.39343,0.87124],[0.43574,0.85444],[0.47323,0.82413],[0.50175,0.77982],[0.52134,0.728],[0.53711,0.67396],[0.571,0.63804],[0.61405,0.62376],[0.65838,0.61907],[0.70291,0.61899],[0.74404,0.63637],[0.76478,0.68667],[0.75475,0.73921],[0.72698,0.78443],[0.71203,0.83856],[0.71332,0.89604],[0.74429,0.93589],[0.78717,0.94928],[0.83152,0.95319],[0.87605,0.95319],[0.91861,0.93866],[0.94621,0.89523],[0.94792,0.83749],[0.93014,0.78532],[0.9059,0.737],[0.897,0.6807],[0.9024,0.62414],[0.9268,0.57577],[0.94543,0.52323],[0.96273,0.46991],[0.968,0.41258],[0.95921,0.35756],[0.92091,0.32938],[0.87667,0.32572],[0.83542,0.34659],[0.79255,0.35891]],"right":[[0.44755,0.15865],[0.49417,0.15865],[0.54055,0.16356],[0.58542,0.17969],[0.60104,0.22804],[0.57181,0.27428],[0.5337,0.30898],[0.50543,0.35445],[0.51546,0.41093],[0.55604,0.43887],[0.60063,0.45642],[0.64521,0.47399],[0.68873,0.4954],[0.73004,0.52303],[0.76523,0.56238],[0.78952,0.61383],[0.80515,0.67087],[0.81626,0.72961],[0.81451,0.78961],[0.78605,0.83681],[0.74956,0.8741],[0.70541,0.89131],[0.65895,0.89467],[0.61237,0.89334],[0.56642,0.88436],[0.5284,0.8525],[0.501,0.80348],[0.47464,0.7381],[0.45999,0.68014],[0.42757,0.63568],[0.38444,0.61132],[0.33714,0.60862],[0.29254,0.62798],[0.27198,0.6802],[0.28317,0.73908],[0.29961,0.79572],[0.30057,0.85712],[0.28175,0.91233],[0.24089,0.94066],[0.19429,0.95053],[0.1471,0.94689],[0.10048,0.93598],[0.06311,0.89939],[0.04892,0.84211],[0.06286,0.78461],[0.08408,0.72959],[0.10038,0.67213],[0.09687,0.61129],[0.06518,0.56517],[0.04412,0.51089],[0.03882,0.45131],[0.04547,0.39249],[0.06974,0.33863,0.5],[0.11459,0.31496,0.5],[0.15978,0.32563,0.5],[0.19632,0.35982]]};
  // Retained auxiliary control points: [X, Y, motion amplitude, phase].
  const DRAGON_PINS = {"left":[[0.6,0.41,0.85,1.4],[0.06,0.28,1.15,2.5],[0.8,0.39,0.48,4.8]],"right":[[0.9,0.58,0.65,2.8],[0.92,0.2,1.15,1.4],[0.11,0.39,1.2,4.8]]};
  // Independent joints for the yellow-circled parts: roots stay relatively stable while tips swing around them instead of translating the entire image.
  // Coordinates refer to the unflipped originals; tips on the same part move together to preserve head and wing contours.
  const DRAGON_LIMBS = {"left":[{"part":"头","root":[0.602941,0.160668],"tips":[[0.852941,0.051414],[0.720588,0.244216]],"swing":0.32,"phase":0,"connections":[[0,1],[0,2]]},{"part":"脚","root":[0.144118,0.745501],"tips":[[0.092647,0.627249],[0.169118,0.578406]],"swing":0.48,"phase":1.2,"connections":[[0,1],[1,2]]},{"part":"脚","root":[0.426471,0.777635],"tips":[[0.294118,0.796915],[0.270588,0.732648]],"swing":0.48,"phase":2.4,"connections":[[0,1],[1,2]]},{"part":"手","root":[0.605882,0.768638],"tips":[[0.676471,0.710797]],"swing":0.48,"phase":3.3,"connections":[[0,1]]},{"part":"手","root":[0.798529,0.706941],"tips":[[0.820588,0.832905],[0.917647,0.800771]],"swing":0.48,"phase":4.1,"connections":[[0,1],[1,2]],"motionScale":0.5},{"part":"翅膀","root":[0.389706,0.404884],"tips":[[0.044118,0.151671]],"outline":[[0.4,0.44],[0.42,0.34],[0.27,0.28],[0.095,0.115],[0.045,0.145],[0.04,0.26],[0.12,0.38],[0.29,0.46]],"swing":0.32,"phase":0.8,"connections":[[0,1]]},{"part":"翅膀","root":[0.308824,0.616967],"tips":[[0.466176,0.562982],[0.658824,0.339332]],"swing":0.32,"phase":2.2,"connections":[[0,1],[1,2]],"motionScale":0.6},{"part":"尾巴","root":[0.808824,0.35347],"tips":[[0.863235,0.323907]],"swing":0.5,"phase":3.6,"motionScale":0.4,"connections":[[0,1]]}],"right":[{"part":"头","root":[0.401471,0.160668],"tips":[[0.139706,0.052699],[0.283824,0.25964]],"swing":0.32,"phase":0.4,"connections":[[0,1],[0,2]]},{"part":"脚","root":[0.832353,0.758355],"tips":[[0.908824,0.655527],[0.85,0.579692]],"swing":0.48,"phase":1.6,"connections":[[0,1],[1,2]]},{"part":"脚","root":[0.577941,0.777635],"tips":[[0.710294,0.802057],[0.732353,0.741645]],"swing":0.48,"phase":2.8,"connections":[[0,1],[1,2]]},{"part":"手","root":[0.394118,0.772494],"tips":[[0.317647,0.703085]],"swing":0.48,"phase":3.7,"connections":[[0,1]]},{"part":"手","root":[0.205882,0.713368],"tips":[[0.197059,0.816195],[0.098529,0.817481]],"swing":0.48,"phase":4.5,"connections":[[0,1],[1,2]],"motionScale":0.5},{"part":"翅膀","root":[0.608824,0.435733],"tips":[[0.957353,0.147815],[0.905882,0.119537]],"outline":[[0.6,0.44],[0.58,0.34],[0.73,0.28],[0.905,0.115],[0.955,0.145],[0.96,0.26],[0.88,0.38],[0.71,0.46]],"swing":0.32,"phase":1.2,"connections":[[0,1],[1,2]]},{"part":"翅膀","root":[0.676471,0.61054],"tips":[[0.539706,0.562982],[0.360294,0.332905]],"swing":0.32,"phase":2.6,"connections":[[0,1],[1,2]],"motionScale":0.6},{"part":"尾巴","root":[0.189706,0.352185],"tips":[[0.133824,0.317481]],"swing":0.5,"phase":4,"connections":[[0,1]],"tipMotionScales":[0.5]}]};

  let canvasElement, initialized = false;
  let lastActivity = 0, hasMoved = false, idle = true;
  let externalIdle = false;
  let soundType = 0;
  let colorMix = 0, dragonLevel = 0, dragonScale = 1, dragonRotation = 0;
  let motionStartedAt = null;
  let puppetStrength = 0, puppetTime = 0;
  let puppetRenderer = null, puppetUnavailable = false;
  let lastClickAt = null; // State 3 tracks clicks separately; mouse movement does not extend its timer.
  let leftDragon = null, rightDragon = null;
  let audioCtx = null, masterGain = null, analyser = null, analyserBuffer = null;
  let voices = [], audioMessage = '';
  const soundBuffers = new Map();
  let playRequest = 0; // Invalidate pending playback requests when switching sounds or resetting after inactivity.

  function resetDragons() {
    motionStartedAt = null;
    dragonLevel = 0;
    dragonScale = 1;
    dragonRotation = 0;
    puppetStrength = 0;
    puppetTime = 0;
  }

  function changeIdle(value) {
    if (idle === value) return;
    idle = value;
    if (idle) {
      hasMoved = false;
      resetAudioState();
    }
  }

  function resetAudioState() {
    soundType = 0; // Return to the initial grayscale, stationary state; the next click starts with sound 1.
    lastClickAt = null;
    resetDragons();
    stopVoices(FADE_SECONDS);
    fadeMaster(0, FADE_SECONDS);
  }

  function setIdle(value) {
    externalIdle = true;
    changeIdle(Boolean(value));
  }

  function noteActivity(moved) {
    lastActivity = performance.now();
    if (!externalIdle) changeIdle(false);
    if (moved) hasMoved = true;
  }

  // Hit area of the heavenly bell in the background, excluding its halo; canvas coordinates account for scaling.
  function isBellHit(x, y) {
    return x >= width * 0.465 && x <= width * 0.535
      && y >= height * 0.03 && y <= height * 0.18;
  }

  function setupAudioChange() {
    if (initialized) return;
    initialized = true;
    canvasElement = document.querySelector('canvas');
    document.addEventListener('mousemove', event => {
      if (event.target === canvasElement) noteActivity(true);
    });
    canvasElement?.addEventListener('click', event => {
      const bounds = canvasElement.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      const x = (event.clientX - bounds.left) * width / bounds.width;
      const y = (event.clientY - bounds.top) * height / bounds.height;
      if (!isBellHit(x, y)) return;
      updateIdle();
      noteActivity(true);
      playSound(Math.min(soundType + 1, 3));
    });
    loadDragon('photo/dragon L.png', DRAGON_PINS.left, DRAGON_LIMBS.left, DRAGON_TORSO_PATHS.left, value => { leftDragon = value; });
    loadDragon('photo/dragon R.png', DRAGON_PINS.right, DRAGON_LIMBS.right, DRAGON_TORSO_PATHS.right, value => { rightDragon = value; });
    // Download and decode audio in advance so the first click does not wait for the entire file to load.
    SOUND_FILES.forEach((_, i) => {
      loadSoundBuffer(i + 1).catch(() => {
        audioMessage = 'Audio could not be loaded. Open the page with Live Server and check the music folder.';
      });
    });
  }

  function loadDragon(path, pins, limbs, torsoPath, save) {
    loadImage(path, img => {
      // Remove near-transparent PNG export residue before creating the grayscale copy and WebGL textures.
      img.loadPixels();
      for (let i = 0; i < img.pixels.length; i += 4) {
        if (img.pixels[i + 3] <= 12) {
          img.pixels[i] = img.pixels[i + 1] = img.pixels[i + 2] = img.pixels[i + 3] = 0;
        }
      }
      img.updatePixels();
      const gray = img.get();
      gray.filter(GRAY);
      // Use light gray for the stone state; strengthen translucent strokes to reduce warm background bleed-through.
      // Modify only dragon pixels, preserving the transparent background and antialiased edges.
      gray.loadPixels();
      for (let i = 0; i < gray.pixels.length; i += 4) {
        const alpha = gray.pixels[i + 3];
        if (alpha === 0) continue;
        const stoneGray = Math.round(gray.pixels[i] * 0.65 + 190 * 0.35);
        gray.pixels[i] = stoneGray;
        gray.pixels[i + 1] = stoneGray;
        gray.pixels[i + 2] = stoneGray;
        gray.pixels[i + 3] = Math.round(alpha + (255 - alpha) * (alpha / 255) * 0.4);
      }
      gray.updatePixels();
      // Soften dragon colors to bronze and brown stone tones while preserving transparency and contour details,
      // helping them blend naturally into the background instead of appearing as a saturated overlay.
      img.loadPixels();
      for (let i = 0; i < img.pixels.length; i += 4) {
        if (img.pixels[i + 3] === 0) continue;
        let r = img.pixels[i], g = img.pixels[i + 1], b = img.pixels[i + 2];
        const brightness = (r + g + b) / 3;
        // Match the brownish-yellow and ochre tones of the waves below rather than neutral gray.
        const earthR = Math.round(lerp(r, brightness, 0.22) * 0.96 + 30);
        const earthG = Math.round(lerp(g, brightness, 0.18) * 0.88 + 28);
        const earthB = Math.round(lerp(b, brightness, 0.28) * 0.78 + 18);
        const warmMix = 0.75;
        r = Math.round(r * (1 - warmMix) + earthR * warmMix);
        g = Math.round(g * (1 - warmMix) + earthG * warmMix);
        b = Math.round(b * (1 - warmMix) + earthB * warmMix);
        img.pixels[i] = constrain(r, 40, 255);
        img.pixels[i + 1] = constrain(g, 30, 255);
        img.pixels[i + 2] = constrain(b, 20, 255);
      }
      img.updatePixels();
      save({ color: img, gray, puppet: createPuppetMesh(pins, limbs, torsoPath) });
    }, () => { audioMessage = 'Dragon images could not be loaded. Check the photo folder.'; });
  }

  // Moving least squares (MLS) similarity deformation: green control points move the local mesh while preserving dragon scale and head shapes.
  // Precompute each vertex's control-point weights; each frame only updates point offsets without solving the weights again.
  function createTorsoPins(torsoPath, auxiliaryPins) {
    // Sample the red centerline evenly by arc length; advance phase continuously along the path to follow torso bends.
    const tail = auxiliaryPins[2];
    const body = torsoPath.map((point, i) => {
      const alongBody = i / (torsoPath.length - 1);
      const wave = Math.sin(Math.PI * alongBody);
      const amplitude = (0.45 + 0.45 * wave) * (1 + TORSO_BEND_BOOST * wave) * TORSO_MOTION_SCALE;
      const tailBlend = Math.max(0, (alongBody - 0.82) / 0.18);
      const blend = tailBlend * tailBlend * (3 - 2 * tailBlend);
      // Blend back to the limited tail amplitude so the torso boost does not amplify the tail tip.
      return [point[0], point[1], (amplitude + (tail[2] - amplitude) * blend) * (point[2] ?? 1), alongBody * tail[3]];
    });
    return body.concat(auxiliaryPins.map(pin => pin.slice()));
  }

  function createPuppetMesh(controlPins, limbs, torsoPath) {
    const wings = limbs.filter(limb => limb.part === '翅膀');
    const pins = createTorsoPins(torsoPath, controlPins);
    // Replace the old wingtip wave motion: existing points within each wing follow the same wing root.
    pins.forEach(pin => {
      pin.wing = wings.find(wing => wingProtection(pin[0], pin[1], wing) > 0.3);
    });
    limbs.forEach(limb => {
      const isWing = limb.part === '翅膀';
      const motionScale = limb.motionScale ?? 1;
      pins.push([limb.root[0], limb.root[1], isWing ? 0 : 0.15 * motionScale, limb.phase]);
      limb.tips.forEach((tip, index) => {
        const edge = limb.connections?.find(connection => connection[1] === index + 1);
        const parent = edge && edge[0] > 0 ? limb.tips[edge[0] - 1] : limb.root;
        const tipScale = motionScale * (limb.tipMotionScales?.[index] ?? 1);
        const pin = [tip[0], tip[1], isWing ? 0 : 0.15 * tipScale, limb.phase, parent[0], parent[1], limb.swing * tipScale];
        if (isWing) pin.wing = limb;
        pins.push(pin);
      });
    });
    pins.push([0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0]);
    const vertices = [], indices = [];
    for (let row = 0; row <= PUPPET_ROWS; row++) {
      for (let col = 0; col <= PUPPET_COLUMNS; col++) {
        const x = col / PUPPET_COLUMNS, y = row / PUPPET_ROWS;
        const weights = pins.map(p => 1 / ((x - p[0]) ** 2 + (y - p[1]) ** 2 + 0.0001) ** 2);
        const total = weights.reduce((a, b) => a + b, 0);
        let px = 0, py = 0;
        pins.forEach((p, i) => { px += weights[i] * p[0] / total; py += weights[i] * p[1] / total; });
        let mu = 0;
        pins.forEach((p, i) => { mu += weights[i] * ((p[0] - px) ** 2 + (p[1] - py) ** 2); });
        const coefficients = new Float32Array(pins.length * 2);
        pins.forEach((p, i) => {
          const dx = p[0] - px, dy = p[1] - py;
          coefficients[i * 2] = weights[i] / total + weights[i] / mu * ((x - px) * dx + (y - py) * dy);
          coefficients[i * 2 + 1] = weights[i] / mu * ((x - px) * dy - (y - py) * dx);
        });
        // Swing each wing as a nearly rigid surface to prevent separate control points from pulling feather tips into sharp corners.
        let wingIndex = -1, wingWeight = 0;
        wings.forEach((wing, i) => {
          const weight = wingProtection(x, y, wing);
          if (weight > wingWeight) { wingIndex = i; wingWeight = weight; }
        });
        vertices.push({ x, y, coefficients, wingIndex, wingWeight });
      }
    }
    for (let row = 0; row < PUPPET_ROWS; row++) {
      for (let col = 0; col < PUPPET_COLUMNS; col++) {
        const a = row * (PUPPET_COLUMNS + 1) + col, b = a + 1, c = a + PUPPET_COLUMNS + 1;
        indices.push(a, c, b, b, c, c + 1);
      }
    }
    return { pins, wings, vertices, indices: new Uint16Array(indices), data: new Float32Array(vertices.length * 4), offsets: new Float32Array(pins.length * 2) };
  }

  function wingProtection(x, y, wing) {
    const outline = wing.outline || [wing.root, ...wing.tips];
    let inside = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const a = outline[i], b = outline[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    if (inside) return 1;
    let distance = Infinity;
    outline.forEach((a, i) => {
      const b = outline[(i + 1) % outline.length], vx = b[0] - a[0], vy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy)));
      distance = Math.min(distance, Math.hypot(x - a[0] - t * vx, y - a[1] - t * vy));
    });
    const weight = Math.max(0, 1 - distance / 0.045);
    return weight * weight * (3 - 2 * weight); // Blend smoothly between the wing and the body.
  }

  function wingDisplacement(x, y, wing, w, h) {
    const phase = puppetTime * 1.8 - wing.phase;
    const vx = (x - wing.root[0]) * w, vy = (y - wing.root[1]) * h;
    const reach = Math.max(...wing.tips.map(tip => Math.hypot((tip[0] - wing.root[0]) * w, (tip[1] - wing.root[1]) * h)));
    const alongWing = Math.min(1, Math.hypot(vx, vy) / Math.max(1, reach));
    const flex = WING_FLEX * Math.min(1, puppetStrength) * alongWing ** 2 * Math.sin(phase + 0.4);
    const swing = Math.max(-WING_MAX_SWING, Math.min(WING_MAX_SWING, wing.swing * puppetStrength * Math.sin(phase) + flex)) * (wing.motionScale ?? 1);
    // Rotate at the displayed aspect ratio to preserve wing proportions; the red wing-root point always has zero offset.
    return [(vx * (Math.cos(swing) - 1) - vy * Math.sin(swing)) / w,
      (vx * Math.sin(swing) + vy * (Math.cos(swing) - 1)) / h];
  }

  // Render the deformed triangle mesh on a separate small WebGL canvas to avoid gaps from Canvas strip slicing.
  // Keep the main canvas and p5 renderer intact, then composite the result in the original layer order.
  function createPuppetRenderer() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true });
    if (!gl) throw new Error('Could not create the dragon deformation mesh');
    const renderLimit = Math.min(2048, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0], gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1]);
    const textureLimit = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    function shader(type, source) {
      const result = gl.createShader(type);
      gl.shaderSource(result, source);
      gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
      return result;
    }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, `
      attribute vec2 aPosition;
      attribute vec2 aUV;
      varying vec2 vUV;
      void main() {
        vUV = aUV;
        gl_Position = vec4((aPosition.x - 0.5) * ${PUPPET_VIEW_INSET * 2}, (0.5 - aPosition.y) * ${PUPPET_VIEW_INSET * 2}, 0.0, 1.0);
      }
    `));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D uColor;
      uniform sampler2D uGray;
      uniform float uMix;
      uniform vec2 uOutlineStep;
      varying vec2 vUV;
      void main() {
        vec4 pixel = mix(texture2D(uGray, vUV), texture2D(uColor, vUV), uMix);
        float edge = 0.0;
        for (int i = 0; i < 8; i++) {
          float angle = float(i) * 0.785398163;
          vec2 offset = vec2(cos(angle), sin(angle)) * uOutlineStep;
          edge = max(edge, texture2D(uGray, vUV + offset).a);
        }
        // Exclude transparent residue from the outline; the GPU deforms the ink outline along with the mesh.
        float inkAlpha = smoothstep(0.094, 0.5, edge) * (1.0 - pixel.a);
        gl_FragColor = vec4(pixel.rgb * pixel.a + vec3(25.0, 20.0, 15.0) / 255.0 * inkAlpha,
          pixel.a + inkAlpha);
      }
    `));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const vertexBuffer = gl.createBuffer(), indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const position = gl.getAttribLocation(program, 'aPosition'), uv = gl.getAttribLocation(program, 'aUV');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
    gl.uniform1i(gl.getUniformLocation(program, 'uColor'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'uGray'), 1);
    const mixLocation = gl.getUniformLocation(program, 'uMix');
    const outlineLocation = gl.getUniformLocation(program, 'uOutlineStep');
    let indicesUploaded = false;
    function texture(img) {
      const source = document.createElement('canvas');
      // Preserve original PNG detail; downscale only when exceeding the device texture limit.
      const factor = Math.min(1, textureLimit / Math.max(img.width, img.height));
      source.width = Math.max(1, Math.round(img.width * factor));
      source.height = Math.max(1, Math.round(img.height * factor));
      const context = source.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(img.canvas, 0, 0, source.width, source.height);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      return tex;
    }
    return {
      draw(dragon, w, h) {
        if (gl.isContextLost()) throw new Error('The dragon mesh WebGL context was lost');
        // Account for high pixel density, breathing enlargement, and mesh padding to avoid stretching a low-resolution render.
        const density = Math.max(1, pixelDensity());
        const required = Math.max(w, h) * density * DRAGON_MAX_SCALE / PUPPET_VIEW_INSET;
        const resolution = Math.min(renderLimit, Math.max(1024, Math.ceil(required / 128) * 128));
        if (canvas.width !== resolution) canvas.width = canvas.height = resolution;
        if (!dragon.textures) dragon.textures = [texture(dragon.color), texture(dragon.gray)];
        const mesh = dragon.puppet;
        mesh.pins.forEach((pin, i) => {
          if (pin.wing) {
            const offset = wingDisplacement(pin[0], pin[1], pin.wing, w, h);
            mesh.offsets[i * 2] = offset[0];
            mesh.offsets[i * 2 + 1] = offset[1];
            return;
          }
          const amplitude = PUPPET_MAX_BEND * puppetStrength * pin[2];
          mesh.offsets[i * 2] = amplitude * Math.sin(puppetTime * 1.8 - pin[3]);
          mesh.offsets[i * 2 + 1] = amplitude * 0.7 * Math.sin(puppetTime * 1.8 - pin[3] + Math.PI / 2);
          if (pin.length > 4) {
            // Use separate phases for head nods, limb swings, wing flaps, and tail swishes.
            let swing = pin[6] * puppetStrength * Math.sin(puppetTime * 1.8 - pin[3]);
            const dx = pin[0] - pin[4], dy = pin[1] - pin[5];
            mesh.offsets[i * 2] += dx * (Math.cos(swing) - 1) - dy * Math.sin(swing);
            mesh.offsets[i * 2 + 1] += dx * Math.sin(swing) + dy * (Math.cos(swing) - 1);
          }
        });
        mesh.vertices.forEach((vertex, i) => {
          let dx = 0, dy = 0;
          for (let j = 0; j < mesh.pins.length; j++) {
            const a = vertex.coefficients[j * 2], b = vertex.coefficients[j * 2 + 1];
            const ox = mesh.offsets[j * 2], oy = mesh.offsets[j * 2 + 1];
            dx += a * ox + b * oy;
            dy += -b * ox + a * oy;
          }
          if (vertex.wingIndex >= 0) {
            const wing = mesh.wings[vertex.wingIndex];
            const offset = wingDisplacement(vertex.x, vertex.y, wing, w, h);
            dx += (offset[0] - dx) * vertex.wingWeight;
            dy += (offset[1] - dy) * vertex.wingWeight;
          }
          // Write the denser mesh directly into the buffer to reduce small-array allocations per frame.
          const offset = i * 4;
          mesh.data[offset] = vertex.x + dx;
          mesh.data[offset + 1] = vertex.y + dy;
          mesh.data[offset + 2] = vertex.x;
          mesh.data[offset + 3] = vertex.y;
        });
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        if (!indicesUploaded) {
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
          indicesUploaded = true; // Both dragons share the same mesh topology, so upload indices only once.
        }
        dragon.textures.forEach((tex, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); });
        gl.uniform1f(mixLocation, colorMix);
        const lineWidth = Math.max(1.2, Math.min(2.4, width * 0.002));
        gl.uniform2f(outlineLocation, lineWidth / w, lineWidth / h);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        // Compensate for the shader inset, preserving edge padding without changing the displayed dragon size.
        drawingContext.drawImage(canvas, -w / (2 * PUPPET_VIEW_INSET), -h / (2 * PUPPET_VIEW_INSET), w / PUPPET_VIEW_INSET, h / PUPPET_VIEW_INSET);
      }
    };
  }

  function updateIdle() {
    // Use the time module's global isIdle when available; otherwise use this module's 10-second timer.
    if (typeof isIdle === 'boolean') {
      externalIdle = true;
      changeIdle(isIdle);
    } else if (!externalIdle && !idle && performance.now() - lastActivity >= IDLE_TIME) {
      changeIdle(true);
    }
    // Restore the initial grayscale pose after 10 seconds without a click in state 3, even if the mouse keeps moving.
    if (soundType === 3 && lastClickAt !== null && performance.now() - lastClickAt >= IDLE_TIME) {
      resetAudioState();
    }
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('This browser does not support audio analysis.');
      audioCtx = new Context();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserBuffer = new Float32Array(analyser.fftSize);
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function fadeMaster(target, seconds) {
    if (!masterGain) return;
    const param = masterGain.gain, now = audioCtx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(target, now + seconds);
  }

  function stopVoices(fade) {
    playRequest++;
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    voices.forEach(voice => {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0, now, Math.max(0.01, fade / 5));
      voice.sources.forEach(source => {
        try { source.stop(now + fade); } catch (_) { /* Already ended. */ }
      });
    });
    voices = [];
  }

  function beginSound(type) {
    if (![1, 2, 3].includes(type)) return false;
    updateIdle();
    if (externalIdle && idle) return false;
    const continuingThirdState = soundType === 3;
    if (continuingThirdState) type = 3;
    noteActivity(false);
    lastClickAt = performance.now();
    hasMoved = true; // Show the current phase correctly when an external module triggers audio directly.
    soundType = type;
    if (!continuingThirdState) {
      resetDragons();
      if (type >= 2) motionStartedAt = performance.now();
    }
    if (type === 1) {
      // Reset to grayscale before fading back to color for sound 1.
      colorMix = 0;
    }
    return type;
  }

  async function loadSoundBuffer(type) {
    if (!soundBuffers.has(type)) {
      const loading = (async () => {
        const response = await fetch(encodeURI(SOUND_FILES[type - 1]));
        if (!response.ok) throw new Error('Could not load audio: ' + SOUND_FILES[type - 1]);
        const bytes = await response.arrayBuffer();
        return ensureAudio().decodeAudioData(bytes);
      })();
      soundBuffers.set(type, loading);
      loading.catch(() => { soundBuffers.delete(type); }); // Allow the next click to retry after a loading failure.
    }
    return soundBuffers.get(type);
  }

  // Skip leading silence but retain about 20 ms before the strike to avoid a long delay after clicking.
  function findSoundStart(buffer) {
    const limit = Math.min(buffer.length, Math.floor(buffer.sampleRate * 5));
    let first = limit;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < first; i++) {
        if (Math.abs(data[i]) > 0.003) { first = i; break; }
      }
    }
    return first < limit ? Math.max(0, first / buffer.sampleRate - 0.02) : 0;
  }

  async function playSound(type) {
    type = beginSound(type);
    if (!type) return;
    // Repeated clicks in state 3 extend the current chant without restarting the recording or resetting the dragon angle.
    const activeChant = type === 3 && voices.find(voice => voice.type === 3 && voice.endsAt > audioCtx.currentTime);
    if (activeChant) {
      const now = audioCtx.currentTime;
      const param = activeChant.gain.gain;
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
      else {
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
      }
      param.linearRampToValueAtTime(1, now + 0.08);
      param.setValueAtTime(1, now + SOUND_DURATION_SECONDS - FADE_SECONDS);
      param.linearRampToValueAtTime(0, now + SOUND_DURATION_SECONDS);
      activeChant.endsAt = now + SOUND_DURATION_SECONDS;
      activeChant.sources[0].stop(activeChant.endsAt);
      fadeMaster(MAX_VOLUME, 0.08);
      audioCtx.resume().catch(() => { audioMessage = 'Click the Heavenly Bell again to enable audio.'; });
      return;
    }
    stopVoices(0.12);
    const request = playRequest;
    try {
      const context = ensureAudio();
      // Call resume directly from the user click, before waiting for the file download.
      const resumed = context.resume();
      audioMessage = 'Loading audio…';
      const [buffer] = await Promise.all([loadSoundBuffer(type), resumed]);
      updateIdle();
      if (request !== playRequest || idle) return;
      fadeMaster(MAX_VOLUME, 0.08);
      const now = context.currentTime;
      const bus = context.createGain();
      bus.connect(masterGain);
      const source = context.createBufferSource();
      source.buffer = buffer;
      const offset = findSoundStart(buffer);
      source.loop = true; // Loop files shorter than 10 seconds to fill the duration; all three current files exceed 10 seconds.
      source.loopStart = offset;
      source.loopEnd = buffer.duration;
      source.connect(bus);
      const voice = { gain: bus, sources: [source], type, endsAt: now + SOUND_DURATION_SECONDS };
      voices.push(voice);
      const duration = SOUND_DURATION_SECONDS;
      bus.gain.setValueAtTime(0, now);
      bus.gain.linearRampToValueAtTime(1, now + (type === 3 ? 0.4 : 0.015));
      bus.gain.setValueAtTime(1, now + duration - FADE_SECONDS);
      bus.gain.linearRampToValueAtTime(0, now + duration);
      source.onended = () => {
        source.disconnect();
        bus.disconnect();
        voices = voices.filter(item => item !== voice);
      };
      source.start(now, offset);
      source.stop(now + duration);
      audioMessage = '';
    } catch (error) {
      if (request === playRequest) audioMessage = 'Audio playback failed. Check the audio files and open the page with Live Server.';
      console.error('Audio playback failed:', error);
    }
  }

  function updateMusic() {
    updateIdle();
    const dt = Math.min(deltaTime, 100) / 1000;
    let targetLevel = 0;
    if (!idle && analyser && audioCtx.state === 'running') {
      analyser.getFloatTimeDomainData(analyserBuffer);
      let energy = 0;
      for (const value of analyserBuffer) energy += value * value;
      targetLevel = Math.min(1, Math.sqrt(energy / analyserBuffer.length) / DRAGON_RMS_MAX);
    }
    const motionElapsed = motionStartedAt === null ? DRAGON_MOTION_TIME : performance.now() - motionStartedAt;
    const motionActive = !idle && (soundType === 3 || (soundType === 2 && motionElapsed < DRAGON_MOTION_TIME));
    if (motionActive) {
      // Maintain the breathing rhythm; repeated clicks extend state 3, while measured audio amplitude still controls breathing strength.
      const breath = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(motionElapsed / 1000 * Math.PI * 2 * 0.9));
      targetLevel = Math.max(targetLevel, breath);
    }
    const smooth = 1 - Math.exp(-dt * 9);
    dragonLevel = lerp(dragonLevel, targetLevel, smooth);
    const colorTarget = !idle && soundType > 0 ? 1 : 0;
    const colorSpeed = colorTarget > colorMix ? 1.2 : 3; // Restore color more slowly while keeping the return-to-stone speed unchanged.
    colorMix = lerp(colorMix, colorTarget, 1 - Math.exp(-dt * colorSpeed));
    if ((idle || soundType === 0) && colorMix < 0.02) colorMix = 0;
    if (!motionActive) resetDragons();
    else {
      // Accumulate the shared angle slowly; a full turn need not finish within 10 seconds, and repeated clicks preserve the angle.
      if (soundType === 3) dragonRotation = (dragonRotation + dt * DRAGON_ROTATION_SPEED) % (Math.PI * 2);
      dragonScale = lerp(dragonScale, 1 + (DRAGON_MAX_SCALE - 1) * dragonLevel, smooth);
      const puppetTarget = (soundType === 3 ? PUPPET_ROTATION_STRENGTH : PUPPET_BREATH_STRENGTH) * (0.35 + 0.65 * dragonLevel);
      puppetStrength = lerp(puppetStrength, puppetTarget, 1 - Math.exp(-dt * 5));
      puppetTime += dt * (0.8 + dragonLevel * 0.5);
    }
  }

  function drawHeavenDragons() {
    if (!leftDragon || !rightDragon) return;
    // Adapt to the canvas size, initially placing one dragon on each side of the center.
    const aspect = Math.max(leftDragon.color.height / leftDragon.color.width,
      rightDragon.color.height / rightDragon.color.width);
    const dw = Math.min(width * DRAGON_SIZE_RATIO, height * 0.46 / aspect);
    const dh = dw * aspect;
    const gap = width * DRAGON_GAP_RATIO;
    const cy = height / 2;
    // Keep the orbit centered on the canvas; recalculate automatically after resizing.
    const centerX = width / 2;
    const radius = gap / 2 + dw / 2;
    // Canvas Y increases downward, so negative angles produce the counterclockwise motion shown by the reference arrows.
    const orbitX = radius * Math.cos(-dragonRotation);
    const orbitY = radius * Math.sin(-dragonRotation);
    // Keep the dragons 180 degrees apart and spin them through the same angle; a full turn restores their starting positions and orientations.
    drawDragon(leftDragon, centerX - orbitX, cy - orbitY, dw, dh, -dragonRotation, true);
    drawDragon(rightDragon, centerX + orbitX, cy + orbitY, dw, dh, -dragonRotation);
  }

  function drawDragon(dragon, cx, cy, w, h, angle, flipY = false) {
    push();
    imageMode(CENTER);
    translate(cx, cy);
    rotate(angle);
    scale(dragonScale);
    if (flipY) scale(1, -1); // Flip the left dragon vertically around its own center.
    if (puppetStrength > 0.001 && !puppetUnavailable) {
      try {
        if (!puppetRenderer) puppetRenderer = createPuppetRenderer();
        puppetRenderer.draw(dragon, w, h);
        pop();
        return;
      } catch (error) {
        puppetUnavailable = true; // If WebGL is unavailable, retain the original images, audio, and rotation.
        console.warn('Dragon mesh animation is unavailable:', error);
      }
    }
    drawDragonOutline(dragon.gray.canvas, -w / 2, -h / 2, w, h);
    tint(255, 255 * (1 - colorMix));
    image(dragon.gray, 0, 0, w, h);
    // Fade out the stone layer as color returns so the light gray does not alter the fully colored appearance.
    // Do not overlay the original color image when colorMix is 0.
    if (colorMix > 0) {
      // Tint toward the brownish-yellow and ochre tones below for an aged appearance without a gray cast.
      tint(215, 170, 120, 255 * colorMix);
      image(dragon.color, 0, 0, w, h);
    }
    pop();
  }

  function drawMusicHint() {
    const hint = document.getElementById('audio-story-hint');
    if (!hint) return;
    const labels = ['Jade Chime · Awaken the Colors', 'War Drum · Bring the Heartbeat to Life', 'Sacred Chant · Let the Dragons Soar'];
    hint.textContent = audioMessage || (idle || !hasMoved
      ? 'Move your mouse to awaken the painting, then click the Heavenly Bell to listen'
      : soundType === 0 ? 'Click the Heavenly Bell: Jade Chime → War Drum → Sacred Chant'
        : `${labels[soundType - 1]} · ${soundType === 3 ? 'Click the Heavenly Bell again to continue; 10 seconds without a click resets the scene' : 'Click the Heavenly Bell again to switch sounds'}`);
  }

  window.setupAudioChange = setupAudioChange;
  window.drawHeavenDragons = drawHeavenDragons;
  window.updateMusic = updateMusic;
  window.drawMusicHint = drawMusicHint;
  window.YuanzeAudio = {
    setIdle, isBellHit
  };
})();





