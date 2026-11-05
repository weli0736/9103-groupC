// =============================================================
// IDEA9103 - Main Sketch (Global Dispatcher)
// Lead/Time-base: Haocheng Gong
// =============================================================

let bgBase, bgElements;
let yutuImg, jinwuImg;

// Haocheng's two time-base module instances
let timebase2, timebase1;

// Interaction and idle state management
let lastActiveTime = 0;
let isIdle = true;
let idleThreshold = 10000;

function preload() {
  // Load all assets from the photo/ folder, with error messages
  bgBase = loadImage('photo/bg1.png', null, () => console.error('Cannot find bg1.png'));
  bgElements = loadImage('photo/bg2.png', null, () => console.error('Cannot find bg2.png'));
  yutuImg = loadImage('photo/yutu1.png', null, () => console.error('Cannot find yutu1.png'));
  jinwuImg = loadImage('photo/jinwu1.png', null, () => console.error('Cannot find jinwu1.png'));
}

function setup() {
  // Match the canvas size to the base background image
  createCanvas(bgBase.width, bgBase.height);
  smooth();
  frameRate(60);

  // Initialize Yuanze's audio system (if loaded)
  if (typeof setupAudioChange === 'function') {
    setupAudioChange();
  }

  // Initialize Haocheng's time-base modules
  timebase2 = new TimeBase2Module(width, height);
  timebase1 = new TimeBase1Module(width, height);

  // Junyu: initialize User Input lantern
  if (typeof setupJunyuLantern === 'function') {
    setupJunyuLantern();
  }
}

function draw() {
  // 1. Check the global idle state
  if (millis() - lastActiveTime > idleThreshold) {
    isIdle = true;
  }

  // 2. Update the audio state
  if (typeof updateMusic === 'function') {
    updateMusic();
  }

  background(40, 32, 28);

  // ==========================================
  // [Layer 1]: Base background texture (bg1)
  // ==========================================
  blendMode(BLEND);
  imageMode(CORNER);
  image(bgBase, 0, 0, width, height);

  // ==========================================
  // [Layer 2]: Kristen's flowing background clouds
  // ==========================================
  if (typeof drawKristenClouds === 'function') {
    drawKristenClouds(isIdle);
  }

  // ==========================================
  // [Layer 3]: timebase-2 (scene under the fog: bg2, waves, tree fruits, bell glow)
  // ==========================================
  timebase2.display(bgElements);

  // ==========================================
  // [Layer 4]: Yuanze's dragons (between the background and the fog)
  // ==========================================
  imageMode(CENTER);
  drawYuanzeDragons(isIdle);

  // ==========================================
  // [Layer 5]: Kristen's full-screen thick fog
  // ==========================================
  if (typeof drawKristenFog === 'function') {
    drawKristenFog(isIdle, mouseX, mouseY);
  }

  // ==========================================
  // [Layer 6]: timebase-1 (sun and moon cycle above the fog, linked to fog clearing)
  // ==========================================
  timebase1.display();

  // ==========================================
  // [Layer 7]: Junyu's mouse-controlled Changxin Palace Lantern
  // ==========================================
  if (typeof drawJunyuLantern === 'function') {
    drawJunyuLantern(isIdle);
  }

  // ==========================================
  // [Layer 8]: Interaction hint text (Yuanze - Audio)
  // ==========================================
  if (typeof drawMusicHint === 'function') {
    drawMusicHint();
  }
}

// ==========================================
// Global input listeners (awaken the scroll and ring the bell)
// ==========================================
function mouseMoved() {
  lastActiveTime = millis();
  isIdle = false;
}

function mouseDragged() {
  // Keep long press-and-drag from counting as idle
  lastActiveTime = millis();
  isIdle = false;
}

function mousePressed() {
  // Check if the heavenly bell was clicked to switch the music
  if (typeof YuanzeAudio !== 'undefined' && typeof YuanzeAudio.isBellHit === 'function') {
    if (!YuanzeAudio.isBellHit(mouseX, mouseY)) return;
  }
  lastActiveTime = millis();
  isIdle = false;
}

// ==========================================
// ⬇️ Team module hook placeholders (prevent errors if a module is not loaded) ⬇️
// ==========================================
function drawYuanzeDragons(idleState) {
  if (typeof YuanzeAudio !== 'undefined' && typeof YuanzeAudio.setIdle === 'function') {
    YuanzeAudio.setIdle(idleState);
  }
  if (typeof drawHeavenDragons === 'function') {
    drawHeavenDragons();
  }
}
