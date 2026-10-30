// YUANZE：点击声音 → 变色、呼吸、缓慢公转和自转；状态 3 可续点，10 秒不点恢复石化。
// 保留 sketch.js 原有的五个调用函数，所有状态封装在本文件内。
// Junyu：useExternalClicks(true) 后，在点击回调里调用 YuanzeAudio.playSound(1/2/3)。
// Haocheng：调用 YuanzeAudio.setIdle(boolean)，接管统一空闲状态。
// 使用 music 中的真实录音；通过 Live Server 打开页面以加载音频文件。
(() => {
  'use strict';
  const SCROLL_ZONE = 1 / 4;
  const SCROLL_MIN_SPEED = 80;
  const SCROLL_MAX_SPEED = SCROLL_MIN_SPEED * 2;
  const IDLE_TIME = 10000;
  const FADE_SECONDS = 1.5;
  const MAX_VOLUME = 0.8;
  const SOUND_DURATION_SECONDS = 10; // 每次点击播放 10 秒，下一次点击可提前切换。
  const SOUND_FILES = ['music/Singing bowl.mp3', 'music/Chinese kit.mp3', 'music/Buddhist chanting.wav'];
  const DRAGON_SIZE_RATIO = 0.4;
  const DRAGON_GAP_RATIO = 0.10;
  const DRAGON_EDGE_RATIO = 0.02;
  const DRAGON_MAX_SCALE = 1.10;
  const DRAGON_RMS_MAX = 0.20;
  const DRAGON_MOTION_TIME = 10000; // 声音 2 的运动持续 10 秒；状态 3 使用独立点击计时。
  const DRAGON_ROTATION_SPEED = 0.12; // 弧度/秒，公转和自转同速，约 52 秒一圈。
  const PUPPET_MAX_BEND = 0.055; // 基础扭动幅度，改大则扭动更明显。
  const PUPPET_BREATH_STRENGTH = 0.8; // 声音 2：呼吸阶段的扭动强度。
  const PUPPET_ROTATION_STRENGTH = 1.3; // 声音 3：旋转阶段的扭动更大。
  const WING_MAX_SWING = 0.32; // 沿轴旋转幅度增加 100%，上限约 18°。
  const WING_FLEX = 0.018; // 弯曲幅度增加 50%，继续保留翼尖轮廓保护。
  const PUPPET_VIEW_INSET = 0.72; // 为翅膀、尾巴的大幅摆动预留边缘空间。
  const PUPPET_COLUMNS = 36; // 加密表面网格，改善躯干弯曲的细腻程度。
  const PUPPET_ROWS = 44;
  const TORSO_BEND_BOOST = 0.18; // 躯干中段的扭动最多增强 18%，两端平滑减弱。
  const TORSO_MOTION_SCALE = 1.89; // 在此前 2.7 倍的基础上减小 30%（2.7 × 0.7）。
  // 按用户红色路径提取的连续躯干中心线：每条龙 56 个等弧长节点。
  // 使用原图归一化坐标，左侧路径已换算回上下翻转前。
  // 右龙 B28–B56 已按第二次红线修正到躯干/尾部中线。
  const DRAGON_TORSO_PATHS = {
    left: [
      [0.44145, 0.24088],
      [0.41212, 0.2764],
      [0.44535, 0.31168],
      [0.48224, 0.34363],
      [0.5071, 0.39075],
      [0.50176, 0.44431],
      [0.46096, 0.46689],
      [0.41752, 0.47916],
      [0.37371, 0.4888],
      [0.33071, 0.50357],
      [0.28859, 0.52155],
      [0.24966, 0.54943],
      [0.21704, 0.58835],
      [0.19993, 0.64155],
      [0.19105, 0.69812],
      [0.19818, 0.75419],
      [0.2278, 0.79689],
      [0.26713, 0.82391],
      [0.30723, 0.84851],
      [0.34912, 0.86786],
      [0.39343, 0.87124],
      [0.43574, 0.85444],
      [0.47323, 0.82413],
      [0.50175, 0.77982],
      [0.52134, 0.728],
      [0.53711, 0.67396],
      [0.571, 0.63804],
      [0.61405, 0.62376],
      [0.65838, 0.61907],
      [0.70291, 0.61899],
      [0.74404, 0.63637],
      [0.76478, 0.68667],
      [0.75475, 0.73921],
      [0.72698, 0.78443],
      [0.71203, 0.83856],
      [0.71332, 0.89604],
      [0.74429, 0.93589],
      [0.78717, 0.94928],
      [0.83152, 0.95319],
      [0.87605, 0.95319],
      [0.91861, 0.93866],
      [0.94621, 0.89523],
      [0.94792, 0.83749],
      [0.93014, 0.78532],
      [0.9059, 0.737],
      [0.897, 0.6807],
      [0.9024, 0.62414],
      [0.9268, 0.57577],
      [0.94543, 0.52323],
      [0.96273, 0.46991],
      [0.968, 0.41258],
      [0.95921, 0.35756],
      [0.92091, 0.32938],
      [0.87667, 0.32572],
      [0.83542, 0.34659],
      [0.79255, 0.35891]
    ],
    right: [
      [0.44755, 0.15865],
      [0.49417, 0.15865],
      [0.54055, 0.16356],
      [0.58542, 0.17969],
      [0.60104, 0.22804],
      [0.57181, 0.27428],
      [0.5337, 0.30898],
      [0.50543, 0.35445],
      [0.51546, 0.41093],
      [0.55604, 0.43887],
      [0.60063, 0.45642],
      [0.64521, 0.47399],
      [0.68873, 0.4954],
      [0.73004, 0.52303],
      [0.76523, 0.56238],
      [0.78952, 0.61383],
      [0.80515, 0.67087],
      [0.81626, 0.72961],
      [0.81451, 0.78961],
      [0.78605, 0.83681],
      [0.74956, 0.8741],
      [0.70541, 0.89131],
      [0.65895, 0.89467],
      [0.61237, 0.89334],
      [0.56642, 0.88436],
      [0.5284, 0.8525],
      [0.501, 0.80348],
      [0.47464, 0.7381],
      [0.45999, 0.68014],
      [0.42757, 0.63568],
      [0.38444, 0.61132],
      [0.33714, 0.60862],
      [0.29254, 0.62798],
      [0.27198, 0.6802],
      [0.28317, 0.73908],
      [0.29961, 0.79572],
      [0.30057, 0.85712],
      [0.28175, 0.91233],
      [0.24089, 0.94066],
      [0.19429, 0.95053],
      [0.1471, 0.94689],
      [0.10048, 0.93598],
      [0.06311, 0.89939],
      [0.04892, 0.84211],
      [0.06286, 0.78461],
      [0.08408, 0.72959],
      [0.10038, 0.67213],
      [0.09687, 0.61129],
      [0.06518, 0.56517],
      [0.04412, 0.51089],
      [0.03882, 0.45131],
      [0.04547, 0.39249],
      [0.06974, 0.33863],
      [0.11459, 0.31496],
      [0.15978, 0.32563],
      [0.19632, 0.35982]
    ]
  };
  // 保留的辅助节点：[X, Y, 活动幅度, 相位]。
  const DRAGON_PINS = {
    left: [[0.60, 0.41, 0.85, 1.4], [0.06, 0.28, 1.15, 2.5], [0.80, 0.39, 0.48, 4.8]],
    right: [[0.90, 0.58, 0.65, 2.8], [0.92, 0.20, 1.15, 1.4], [0.11, 0.39, 1.2, 4.8]]
  };
  // 黄圈部位的独立关节：根部相对稳定，末端绕根部摆动，而非整张图一起平移。
  // 坐标均为未翻转原图坐标；同一部位的多个末端一起摆动，保留头/翅膀的轮廓。
  const DRAGON_LIMBS = {
    left: [
      { part: '头', root: [0.49, 0.26], tips: [[0.63, 0.12], [0.75, 0.06]], swing: 0.32, phase: 0 },
      { part: '脚', root: [0.17, 0.76], tips: [[0.10, 0.65], [0.08, 0.57]], swing: 0.48, phase: 1.2 },
      { part: '脚', root: [0.34, 0.76], tips: [[0.26, 0.72]], swing: 0.48, phase: 2.4 },
      { part: '手', root: [0.55, 0.74], tips: [[0.61, 0.72]], swing: 0.48, phase: 3.3 },
      { part: '手', root: [0.84, 0.65], tips: [[0.81, 0.77], [0.88, 0.78]], swing: 0.48, phase: 4.1 },
      { part: '翅膀', root: [0.40, 0.44], tips: [[0.03, 0.16], [0.22, 0.24]], outline: [[0.40, 0.44], [0.43, 0.34], [0.27, 0.28], [0.22, 0.24], [0.08, 0.16], [0.01, 0.11], [0.02, 0.26], [0.12, 0.38], [0.29, 0.46]], swing: 0.32, phase: 0.8 },
      { part: '翅膀', root: [0.38, 0.58], tips: [[0.61, 0.43], [0.69, 0.50]], swing: 0.32, phase: 2.2 },
      { part: '尾巴', root: [0.91, 0.47], tips: [[0.83, 0.38], [0.80, 0.29]], swing: 0.5, phase: 3.6, motionScale: 0.4 }
    ],
    right: [
      { part: '头', root: [0.51, 0.25], tips: [[0.37, 0.12], [0.25, 0.06]], swing: 0.32, phase: 0.4 },
      { part: '脚', root: [0.83, 0.76], tips: [[0.90, 0.65], [0.92, 0.57]], swing: 0.48, phase: 1.6 },
      { part: '脚', root: [0.66, 0.76], tips: [[0.74, 0.72]], swing: 0.48, phase: 2.8 },
      { part: '手', root: [0.45, 0.74], tips: [[0.39, 0.72]], swing: 0.48, phase: 3.7 },
      { part: '手', root: [0.16, 0.65], tips: [[0.19, 0.77], [0.12, 0.78]], swing: 0.48, phase: 4.5 },
      { part: '翅膀', root: [0.61, 0.44], tips: [[0.97, 0.16], [0.78, 0.24]], outline: [[0.61, 0.44], [0.57, 0.34], [0.73, 0.28], [0.78, 0.24], [0.92, 0.16], [0.99, 0.11], [0.98, 0.26], [0.88, 0.38], [0.71, 0.46]], swing: 0.32, phase: 1.2 },
      { part: '翅膀', root: [0.62, 0.58], tips: [[0.39, 0.43], [0.31, 0.50]], swing: 0.32, phase: 2.6 },
      { part: '尾巴', root: [0.09, 0.47], tips: [[0.17, 0.38], [0.20, 0.29]], swing: 0.5, phase: 4 }
    ]
  };

  let canvasElement, initialized = false;
  let scrollPos = 0, mouseInWindow = false, mouseWinY = 0;
  let lastActivity = 0, hasMoved = false, idle = true;
  let externalIdle = false, externalClicks = false;
  let soundType = 0, lastSoundType = 0;
  let colorMix = 0, dragonLevel = 0, dragonScale = 1, dragonRotation = 0;
  let motionStartedAt = null;
  let puppetStrength = 0, puppetTime = 0;
  let puppetRenderer = null, puppetUnavailable = false;
  let lastClickAt = null; // 状态 3 单独按点击计时，移动鼠标不会延长。
  let leftDragon = null, rightDragon = null;
  let audioCtx = null, masterGain = null, analyser = null, analyserBuffer = null;
  let voices = [], audioMessage = '';
  const soundBuffers = new Map();
  let playRequest = 0; // 切换/遗忘后，取消仍在加载的旧播放请求。

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
    soundType = 0; // 回到灰白、静止的初始状态，下一次点击从声音 1 开始。
    lastSoundType = 0;
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
    window.dispatchEvent(new CustomEvent('story:activity', { detail: { moved } }));
  }

  function setupAudioChange() {
    if (initialized) return;
    initialized = true;
    canvasElement = document.querySelector('canvas');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollPos = getMaxScroll();
    window.scrollTo({ top: scrollPos, behavior: 'instant' });
    document.addEventListener('mousemove', event => {
      mouseInWindow = true;
      mouseWinY = event.clientY;
      // 自动滚动不算活动，只记录画布上真实的鼠标移动/点击。
      if (event.target === canvasElement) noteActivity(true);
    });
    document.documentElement.addEventListener('mouseleave', () => { mouseInWindow = false; });
    window.addEventListener('blur', () => { mouseInWindow = false; });
    canvasElement?.addEventListener('click', () => {
      if (externalClicks) return;
      updateIdle();
      const canPlay = !idle && hasMoved;
      noteActivity(false);
      if (canPlay) playSound(Math.min(lastSoundType + 1, 3));
    });
    window.addEventListener('story:idle', event => {
      if (typeof event.detail?.isIdle === 'boolean') setIdle(event.detail.isIdle);
    });
    loadDragon('photo/dragon L.png', DRAGON_PINS.left, DRAGON_LIMBS.left, DRAGON_TORSO_PATHS.left, value => { leftDragon = value; });
    loadDragon('photo/dragon R.png', DRAGON_PINS.right, DRAGON_LIMBS.right, DRAGON_TORSO_PATHS.right, value => { rightDragon = value; });
    // 提前下载和解码，首次点击不必等待整个 WAV 文件加载。
    SOUND_FILES.forEach((_, i) => {
      loadSoundBuffer(i + 1).catch(() => {
        audioMessage = '音频加载失败，请用 Live Server 打开，并检查 music 文件夹。';
      });
    });
  }

  function loadDragon(path, pins, limbs, torsoPath, save) {
    loadImage(path, img => {
      const gray = img.get();
      gray.filter(GRAY);
      // 石化状态偏浅灰；加实半透明笔触，减少下方暖色背景透出。
      // 只处理龙本身的像素，保留透明背景和抗锯齿边缘。
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
      save({ color: img, gray, puppet: createPuppetMesh(pins, limbs, torsoPath) });
    }, () => { audioMessage = '龙图片加载失败，请检查 photo 文件夹。'; });
  }

  // 移动最小二乘相似变换（MLS）：绿点带动局部网格，尽量保留龙鳞/头部形状。
  // 预先算好每个顶点对节点的权重，每帧只需计算节点偏移，无需重新求解。
  function createTorsoPins(torsoPath, auxiliaryPins) {
    // 红线中心按弧长均匀取点；相位也沿路径连续推进，不再横穿身体拐弯处。
    const tail = auxiliaryPins[2];
    const body = torsoPath.map((point, i) => {
      const alongBody = i / (torsoPath.length - 1);
      const wave = Math.sin(Math.PI * alongBody);
      const amplitude = (0.45 + 0.45 * wave) * (1 + TORSO_BEND_BOOST * wave) * TORSO_MOTION_SCALE;
      const tailBlend = Math.max(0, (alongBody - 0.82) / 0.18);
      const blend = tailBlend * tailBlend * (3 - 2 * tailBlend);
      // 尾端过渡回已限制的幅度，不把躯干增益叠加到尾尖。
      return [point[0], point[1], amplitude + (tail[2] - amplitude) * blend, alongBody * tail[3]];
    });
    return body.concat(auxiliaryPins.map(pin => pin.slice()));
  }

  function createPuppetMesh(controlPins, limbs, torsoPath) {
    const wings = limbs.filter(limb => limb.part === '翅膀');
    const pins = createTorsoPins(torsoPath, controlPins);
    // 取消旧的翼尖波浪节点：翼面内的旧节点统一跟随同一个翼根。
    pins.forEach(pin => {
      pin.wing = wings.find(wing => wingProtection(pin[0], pin[1], wing) > 0.3);
    });
    limbs.forEach(limb => {
      const isWing = limb.part === '翅膀';
      const motionScale = limb.motionScale ?? 1;
      pins.push([limb.root[0], limb.root[1], isWing ? 0 : 0.15 * motionScale, limb.phase]);
      limb.tips.forEach(tip => {
        const pin = [tip[0], tip[1], isWing ? 0 : 0.15 * motionScale, limb.phase, limb.root[0], limb.root[1], limb.swing * motionScale];
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
        // 翼面采用接近刚性的整体摆动，避免不同节点把羽毛末端拉成尖角。
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
    return weight * weight * (3 - 2 * weight); // 翼面与身体之间平滑衔接。
  }

  function wingDisplacement(x, y, wing, w, h) {
    const phase = puppetTime * 1.8 - wing.phase;
    const vx = (x - wing.root[0]) * w, vy = (y - wing.root[1]) * h;
    const reach = Math.max(...wing.tips.map(tip => Math.hypot((tip[0] - wing.root[0]) * w, (tip[1] - wing.root[1]) * h)));
    const alongWing = Math.min(1, Math.hypot(vx, vy) / Math.max(1, reach));
    const flex = WING_FLEX * Math.min(1, puppetStrength) * alongWing ** 2 * Math.sin(phase + 0.4);
    const swing = Math.max(-WING_MAX_SWING, Math.min(WING_MAX_SWING, wing.swing * puppetStrength * Math.sin(phase) + flex));
    // 在实际显示尺寸下旋转，保持翼面比例；红点翼根自身偏移始终为零。
    return [(vx * (Math.cos(swing) - 1) - vy * Math.sin(swing)) / w,
      (vx * Math.sin(swing) + vy * (Math.cos(swing) - 1)) / h];
  }

  // 单独的小 WebGL 画布绘制变形三角网格，避免 Canvas 横条切片的裂缝。
  // 它不改变主画布或 p5 渲染器，最后仍按原图层顺序绘制回主画布。
  function createPuppetRenderer() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 640;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true });
    if (!gl) throw new Error('无法创建龙的变形网格');
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
      varying vec2 vUV;
      void main() {
        vec4 pixel = mix(texture2D(uGray, vUV), texture2D(uColor, vUV), uMix);
        gl_FragColor = vec4(pixel.rgb * pixel.a, pixel.a);
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
    function texture(img) {
      const source = document.createElement('canvas');
      const factor = Math.min(1, 768 / Math.max(img.width, img.height));
      source.width = Math.max(1, Math.round(img.width * factor));
      source.height = Math.max(1, Math.round(img.height * factor));
      source.getContext('2d').drawImage(img.canvas, 0, 0, source.width, source.height);
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
        if (gl.isContextLost()) throw new Error('龙的变形网格上下文丢失');
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
            // 头部点头、手脚摆动、翅膀扇动、尾端甩动，各部位使用不同相位。
            let swing = pin[6] * puppetStrength * Math.sin(puppetTime * 1.8 - pin[3]);
            const dx = pin[0] - pin[4], dy = pin[1] - pin[5];
            mesh.offsets[i * 2] += dx * (Math.cos(swing) - 1) - dy * Math.sin(swing);
            mesh.offsets[i * 2 + 1] += dx * Math.sin(swing) + dy * (Math.cos(swing) - 1);
          }
        });
        mesh.vertices.forEach((vertex, i) => {
          let dx = 0, dy = 0;
          mesh.pins.forEach((_, j) => {
            const a = vertex.coefficients[j * 2], b = vertex.coefficients[j * 2 + 1];
            const ox = mesh.offsets[j * 2], oy = mesh.offsets[j * 2 + 1];
            dx += a * ox + b * oy;
            dy += -b * ox + a * oy;
          });
          if (vertex.wingIndex >= 0) {
            const wing = mesh.wings[vertex.wingIndex];
            const offset = wingDisplacement(vertex.x, vertex.y, wing, w, h);
            dx += (offset[0] - dx) * vertex.wingWeight;
            dy += (offset[1] - dy) * vertex.wingWeight;
          }
          // 加密后直接写入缓冲区，减少每帧的小数组分配。
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
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
        dragon.textures.forEach((tex, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); });
        gl.uniform1f(mixLocation, colorMix);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        // 与着色器的缩进对应，保留边缘空间且不改变龙的显示大小。
        drawingContext.drawImage(canvas, -w / (2 * PUPPET_VIEW_INSET), -h / (2 * PUPPET_VIEW_INSET), w / PUPPET_VIEW_INSET, h / PUPPET_VIEW_INSET);
      }
    };
  }

  function getMaxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function updateIdle() {
    // 兼容时间组全局 isIdle；未对接时使用本模块的 10 秒计时。
    if (typeof isIdle === 'boolean') {
      externalIdle = true;
      changeIdle(isIdle);
    } else if (!externalIdle && !idle && performance.now() - lastActivity >= IDLE_TIME) {
      changeIdle(true);
    }
    // 即使鼠标仍在移动，状态 3 连续 10 秒没点击也恢复灰白初始姿态。
    if (soundType === 3 && lastClickAt !== null && performance.now() - lastClickAt >= IDLE_TIME) {
      resetAudioState();
    }
  }

  function updateMouseScroll() {
    updateIdle();
    if (Math.abs(window.scrollY - scrollPos) > 2) scrollPos = window.scrollY;
    if (!mouseInWindow || idle) return;
    const zone = window.innerHeight * SCROLL_ZONE;
    let direction, depth;
    if (mouseWinY < zone) {
      direction = -1;
      depth = (zone - mouseWinY) / zone;
    } else if (mouseWinY > window.innerHeight - zone) {
      direction = 1;
      depth = (mouseWinY - window.innerHeight + zone) / zone;
    } else return;
    const speed = SCROLL_MIN_SPEED + (SCROLL_MAX_SPEED - SCROLL_MIN_SPEED) * Math.min(1, depth);
    scrollPos = Math.max(0, Math.min(getMaxScroll(), scrollPos + direction * speed * Math.min(deltaTime, 100) / 1000));
    window.scrollTo({ top: scrollPos, behavior: 'instant' });
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('此浏览器不支持音频分析。');
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
        try { source.stop(now + fade); } catch (_) { /* 已结束 */ }
      });
    });
    voices = [];
  }

  function beginSound(type) {
    if (![1, 2, 3].includes(type)) return false;
    updateIdle();
    if (externalIdle && idle) return false;
    const continuingThirdState = soundType === 3;
    if (continuingThirdState) type = 3; // 外部点击模块仍传 1 时，也继续保持状态 3。
    noteActivity(false);
    lastClickAt = performance.now();
    hasMoved = true; // 外部模块直接触发声音时也正确显示当前阶段。
    soundType = type;
    lastSoundType = type;
    if (!continuingThirdState) {
      resetDragons();
      if (type >= 2) motionStartedAt = performance.now();
    }
    if (type === 1) {
      // 包括循环 3 → 1：先恢复灰白，大小、旋转立即复位，再重新变彩色。
      colorMix = 0;
    }
    return type;
  }

  async function loadSoundBuffer(type) {
    if (!soundBuffers.has(type)) {
      const loading = (async () => {
        const response = await fetch(encodeURI(SOUND_FILES[type - 1]));
        if (!response.ok) throw new Error('无法加载音频：' + SOUND_FILES[type - 1]);
        const bytes = await response.arrayBuffer();
        return ensureAudio().decodeAudioData(bytes);
      })();
      soundBuffers.set(type, loading);
      loading.catch(() => { soundBuffers.delete(type); }); // 失败后允许下一次点击重试。
    }
    return soundBuffers.get(type);
  }

  // 跳过文件开头的静音，保留敲击前约 20ms，避免点击后长时间没有声音。
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
    // 状态 3 再次点击时延长当前梵音，不把录音和龙的角度拉回开头。
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
      audioCtx.resume().catch(() => { audioMessage = '请再次点击画布开启声音。'; });
      return;
    }
    stopVoices(0.12);
    const request = playRequest;
    try {
      const context = ensureAudio();
      // resume 必须直接由这次用户点击触发，不能等文件下载后才调用。
      const resumed = context.resume();
      audioMessage = '正在加载声音…';
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
      source.loop = true; // 文件不足 10 秒时循环补足；本次三份文件都超过 10 秒。
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
      if (request === playRequest) audioMessage = '声音播放失败，请检查音频文件并用 Live Server 打开。';
      console.error('音频播放失败：', error);
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
      // 保留呼吸节奏；状态 3 再点击可持续延长，真实振幅仍控制呼吸强弱。
      const breath = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(motionElapsed / 1000 * Math.PI * 2 * 0.9));
      targetLevel = Math.max(targetLevel, breath);
    }
    const smooth = 1 - Math.exp(-dt * 9);
    dragonLevel = lerp(dragonLevel, targetLevel, smooth);
    colorMix = lerp(colorMix, !idle && soundType > 0 ? 1 : 0, 1 - Math.exp(-dt * 3));
    if ((idle || soundType === 0) && colorMix < 0.02) colorMix = 0;
    if (!motionActive) resetDragons();
    else {
      // 缓慢累加共同角度，不要求在 10 秒内转完一圈，续点也不重置角度。
      if (soundType === 3) dragonRotation = (dragonRotation + dt * DRAGON_ROTATION_SPEED) % (Math.PI * 2);
      dragonScale = lerp(dragonScale, 1 + (DRAGON_MAX_SCALE - 1) * dragonLevel, smooth);
      const puppetTarget = (soundType === 3 ? PUPPET_ROTATION_STRENGTH : PUPPET_BREATH_STRENGTH) * (0.35 + 0.65 * dragonLevel);
      puppetStrength = lerp(puppetStrength, puppetTarget, 1 - Math.exp(-dt * 5));
      puppetTime += dt * (0.8 + dragonLevel * 0.5);
    }
  }

  function drawHeavenDragons() {
    if (!leftDragon || !rightDragon) return;
    const heavenH = earthTop - heavenTop;
    if (heavenH <= 0) return;
    const dh = Math.min(width * DRAGON_SIZE_RATIO * leftDragon.color.height / leftDragon.color.width, heavenH);
    const gap = width * DRAGON_GAP_RATIO;
    const dw = (width - gap) / 2 - width * DRAGON_EDGE_RATIO;
    const cy = (heavenTop + earthTop) / 2;
    // 公转中心固定在画布水平正中间、双龙原来的高度，不受窗口滚动影响。
    const centerX = width / 2;
    const radius = gap / 2 + dw / 2;
    // 画布 Y 轴向下，负角度为图中箭头所示的逆时针方向。
    const orbitX = radius * Math.cos(-dragonRotation);
    const orbitY = radius * Math.sin(-dragonRotation);
    // 两龙始终相隔 180°；以相同角度自转，转满一圈恢复初始位置和朝向。
    drawDragon(leftDragon, centerX - orbitX, cy - orbitY, dw, dh, -dragonRotation, true);
    drawDragon(rightDragon, centerX + orbitX, cy + orbitY, dw, dh, -dragonRotation);
  }

  function drawDragon(dragon, cx, cy, w, h, angle, flipY = false) {
    push();
    imageMode(CENTER);
    translate(cx, cy);
    rotate(angle);
    scale(dragonScale);
    if (flipY) scale(1, -1); // 左龙围绕自身中心上下翻转。
    if (puppetStrength > 0.001 && !puppetUnavailable) {
      try {
        if (!puppetRenderer) puppetRenderer = createPuppetRenderer();
        puppetRenderer.draw(dragon, w, h);
        pop();
        return;
      } catch (error) {
        puppetUnavailable = true; // 不支持 WebGL 时保留原图、声音和旋转效果。
        console.warn('双龙网格变形未启用：', error);
      }
    }
    tint(255, 255 * (1 - colorMix));
    image(dragon.gray, 0, 0, w, h);
    // 彩色恢复后淡去石化底层，避免浅灰层改变正常彩色状态的外观。
    // colorMix 为 0 时完全不叠加原彩色图片。
    if (colorMix > 0) {
      tint(255, 255 * colorMix);
      image(dragon.color, 0, 0, w, h);
    }
    pop();
  }

  function drawMusicHint() {
    const hint = document.getElementById('audio-story-hint');
    if (!hint) return;
    const labels = ['玉磬 · 唤醒色彩', '战鼓 · 注入心跳', '梵音 · 龙腾盘旋'];
    hint.textContent = audioMessage || (idle || !hasMoved
      ? '移动鼠标唤醒画卷，再点击画布聆听'
      : soundType === 0 ? '点击画布：玉磬 → 战鼓 → 梵音'
        : `${labels[soundType - 1]} · ${soundType === 3 ? '再次点击延续，10 秒不点击恢复初始状态' : '再次点击切换'}`);
  }

  window.setupAudioChange = setupAudioChange;
  window.updateMouseScroll = updateMouseScroll;
  window.drawHeavenDragons = drawHeavenDragons;
  window.updateMusic = updateMusic;
  window.drawMusicHint = drawMusicHint;
  window.YuanzeAudio = {
    playSound, setIdle,
    useExternalClicks(value = true) { externalClicks = Boolean(value); },
    // 外部音源需在此 AudioContext 内创建，并只经 connectSource 输出，避免双重播放。
    getAudioContext: ensureAudio,
    connectSource(node) { ensureAudio(); node.connect(masterGain); },
    notifySound(type) {
      if (!beginSound(type)) return;
      try {
        ensureAudio().resume().catch(() => { audioMessage = '请点击画布开启声音。'; });
        stopVoices(0.12);
        fadeMaster(MAX_VOLUME, 0.08);
      } catch (error) { audioMessage = error.message; }
    },
    getState() { return { isIdle: idle, soundType, colorMix, scale: dragonScale, rotation: dragonRotation, level: dragonLevel }; }
  };
})();
