// ==========================================
// IDEA9103 - Awakening Heaven (Team Main Framework)
// Lead/Time-base: Haocheng Gong
// ==========================================

let bgBase, bgElements; 
let imgRatio = 1; 
let canvasWidth, canvasHeight;

let lastActiveTime = 0;
let isIdle = true;       
let idleThreshold = 10000; 

function preload() {
  // [路径修正] 图片在 photo 文件夹里；找不到时控制台会提示
  bgBase = loadImage('photo/bg1.png', null,
    () => console.error('找不到 photo/bg1.png，检查文件名和路径'));
  bgElements = loadImage('photo/bg2.png', null,
    () => console.error('找不到 photo/bg2.png，检查文件名和路径'));
}

function setup() {
  imgRatio = bgBase.width / bgBase.height; 
  calculateCanvasSize();
  createCanvas(canvasWidth, canvasHeight);
  smooth();
  frameRate(60);
  setupAudioChange();
}

function draw() {
  // 1. 全局状态检测
  if (millis() - lastActiveTime > idleThreshold) {
    isIdle = true;
  }
  
  updateMusic();
  background(40, 32, 28); 

  // ==========================================
  // 【图层 1】：最底层的纯背景肌理
  // ==========================================
  blendMode(BLEND); 
  image(bgBase, 0, 0, width, height);

  // ==========================================
  // 【图层 2】：夹在中间的祥云 (Kristen - Perlin Noise)
  // ==========================================
  drawKristenClouds(isIdle);

  // ==========================================
  // 【图层 3】：前景元素图 (日月、树木、天钟)
  // ==========================================
  push();
  blendMode(BLEND); 
  // 【亮度修正】：调高到 210，让整张图亮堂起来，告别死黑，同时保留光效质感
  tint(210); 
  image(bgElements, 0, 0, width, height);
  pop();
  
  // ==========================================
  // 【图层 4】：底部工笔海浪 (Haocheng - Time Base)
  // ==========================================
  let loopDuration = 10000; 
  let cycleProgress = (millis() % loopDuration) / loopDuration; 
  drawStylizedWaves(cycleProgress);

  // ==========================================
  // 【图层 5】：中央空白区的神龙 (Yuanze - Audio)
  // ==========================================
  drawYuanzeDragons(isIdle);

  // ==========================================
  // 【图层 6】：天界发光机制 (Haocheng - Time Base)
  // ==========================================
  let moonIntensity = cycleProgress < 0.5 ? sin(map(cycleProgress, 0, 0.5, 0, 1) * PI) : 0;
  let sunIntensity = cycleProgress >= 0.5 ? sin(map(cycleProgress, 0.5, 1.0, 0, 1) * PI) : 0;
  let bellIntensity = moonIntensity + sunIntensity;

  if (moonIntensity > 0.01) drawMoonSystem(moonIntensity);
  if (sunIntensity > 0.01) drawSunSystem(sunIntensity);
  if (bellIntensity > 0.01) drawBellHaloGlow(bellIntensity);

  // ==========================================
  // 【图层 7】：最顶层的厚重迷雾 (Kristen - Perlin Noise)
  // ==========================================
  drawKristenFog(isIdle, mouseX, mouseY);

  // ==========================================
  // 【图层 8】：全屏鼠标交互与提灯 (Junyu - User Input)
  // ==========================================
  drawJunyuInput(isIdle, mouseX, mouseY);
  drawMusicHint();
}

// ==========================================
// 全局交互监听
// ==========================================
function mouseMoved() {
  lastActiveTime = millis();
  isIdle = false;
}
function mousePressed() {
  if (!YuanzeAudio.isBellHit(mouseX, mouseY)) return;
  lastActiveTime = millis();
  isIdle = false;
}
// [Kristen 新增] 按住鼠标拖动时 p5 不触发 mouseMoved，
// 不加这个的话，拖动超过 10 秒会被判成 idle，雾会合拢
function mouseDragged() {
  lastActiveTime = millis();
  isIdle = false;
}

// ==========================================
// ⬇️ 组员开发接口区 (Placeholders) ⬇️
// ==========================================
// Kristen 的两个函数会被 perlin-noise.js 覆盖（所以 perlin-noise.js 要后加载）
function drawKristenClouds(idleState) { push(); pop(); }
function drawKristenFog(idleState, mx, my) { push(); pop(); }
function drawYuanzeDragons(idleState) {
  YuanzeAudio.setIdle(idleState);
  drawHeavenDragons();
}
function drawJunyuInput(idleState, mx, my) { push(); pop(); }


// ==========================================
// ⬇️ Haocheng 时间机制区 (坐标完美对齐版) ⬇️
// ==========================================
function drawMoonSystem(intensity) {
  push();
  blendMode(ADD); 
  // 月亮主光
  drawBigGlow(width * 0.115, height * 0.16, width * 0.25, 240, 250, 255, intensity);
  
  let mColor = [240, 250, 255]; 
  // 【修正】：加大果实的光晕半径，确保完全照亮
  let r = width * 0.095; 
  
  // 【修正】：重新精确测算的 6 颗银色果实坐标，死死对准每一个果实
  drawBigGlow(width * 0.285, height * 0.115, r, mColor[0], mColor[1], mColor[2], intensity); // 右上 1
  drawBigGlow(width * 0.355, height * 0.155, r, mColor[0], mColor[1], mColor[2], intensity); // 右上 2
  drawBigGlow(width * 0.130, height * 0.350, r, mColor[0], mColor[1], mColor[2], intensity); // 中左 1
  drawBigGlow(width * 0.050, height * 0.430, r, mColor[0], mColor[1], mColor[2], intensity); // 中左 2
  drawBigGlow(width * 0.185, height * 0.480, r, mColor[0], mColor[1], mColor[2], intensity); // 右下 1
  drawBigGlow(width * 0.245, height * 0.550, r, mColor[0], mColor[1], mColor[2], intensity); // 右下 2
  pop();
}

function drawSunSystem(intensity) {
  push();
  blendMode(ADD);
  // 太阳主光
  drawBigGlow(width * 0.905, height * 0.145, width * 0.25, 255, 50, 20, intensity);
  
  let sColor = [255, 50, 20]; 
  let r = width * 0.095; // 同步加大红果光晕
  
  // 7 颗红色果实精确坐标
  drawBigGlow(width * 0.725, height * 0.105, r, sColor[0], sColor[1], sColor[2], intensity);
  drawBigGlow(width * 0.655, height * 0.175, r, sColor[0], sColor[1], sColor[2], intensity);
  drawBigGlow(width * 0.695, height * 0.280, r, sColor[0], sColor[1], sColor[2], intensity);
  drawBigGlow(width * 0.825, height * 0.275, r, sColor[0], sColor[1], sColor[2], intensity);
  drawBigGlow(width * 0.935, height * 0.380, r, sColor[0], sColor[1], sColor[2], intensity);
  drawBigGlow(width * 0.785, height * 0.525, r, sColor[0], sColor[1], sColor[2], intensity);
  drawBigGlow(width * 0.855, height * 0.575, r, sColor[0], sColor[1], sColor[2], intensity);
  pop();
}

function drawBigGlow(x, y, maxRadius, r, g, b, intensity) {
  noStroke();
  let layers = 6; 
  let step = maxRadius / layers;
  for (let i = maxRadius; i > 0; i -= step) {
    let progress = 1 - (i / maxRadius); 
    let alpha = pow(progress, 2) * 100 * intensity; 
    fill(r, g, b, alpha);
    ellipse(x, y, i, i);
  }
}

function drawBellHaloGlow(intensity) {
  push();
  blendMode(ADD); 
  let bellX = width * 0.5;
  let bellY = height * 0.15; 
  noFill(); 
  let innerDiameter = width * 0.05;  
  let outerDiameter = width * 0.18;  
  let layers = 15; 
  let step = (outerDiameter - innerDiameter) / layers;
  for (let i = 0; i < layers; i++) {
    let d = innerDiameter + i * step;
    let progress = i / (layers - 1);
    let alpha = sin(progress * PI) * 25 * intensity;
    stroke(255, 215, 100, alpha); 
    strokeWeight(step * 1.5); 
    ellipse(bellX, bellY, d, d * 0.75); 
  }
  pop();
}

function drawStylizedWaves(cycle) {
  push();
  let phase = cycle * TWO_PI; 
  let waveColors = [
    color(68, 55, 45, 200), color(105, 125, 105, 230), 
    color(150, 125, 90, 240), color(140, 75, 55, 255)    
  ];
  for (let i = 0; i < 4; i++) {
    let yBase = height - (4 - i) * (height * 0.04); 
    let amp = height * 0.04 + i * 2; 
    let freq = 0.012 - i * 0.001; 
    let dir = (i % 2 === 0) ? 1 : -1;
    
    fill(waveColors[i]);
    stroke(25, 20, 15); 
    strokeWeight(3.5);
    beginShape();
    vertex(0, height); 
    for (let x = 0; x <= width; x += 15) { 
      let yOffset = sin(x * freq + phase * dir + i * 2) * amp;
      let yOffset2 = cos(x * freq * 1.5 - phase * dir) * (amp * 0.3);
      vertex(x, yBase + yOffset + yOffset2);
    }
    vertex(width, height); 
    endShape(CLOSE);

    noFill();
    stroke(30, 25, 20, 180); 
    strokeWeight(1.5);
    let innerLinesCount = 3 + i; 
    for (let j = 1; j <= innerLinesCount; j++) {
      let lineSpacing = j * 10; 
      beginShape();
      for (let x = 0; x <= width; x += 15) {
        let yOffset = sin(x * freq + phase * dir + i * 2) * amp;
        let yOffset2 = cos(x * freq * 1.5 - phase * dir) * (amp * 0.3);
        let waveY = yBase + yOffset + yOffset2 + lineSpacing;
        if (waveY <= height + 10) vertex(x, waveY);
      }
      endShape();
    }
  }
  pop();
}

function calculateCanvasSize() {
  canvasWidth = windowWidth * 0.95; 
  canvasHeight = canvasWidth / imgRatio;
  if (canvasHeight > windowHeight * 0.95) {
    canvasHeight = windowHeight * 0.95;
    canvasWidth = canvasHeight * imgRatio;
  }
}

function windowResized() {
  calculateCanvasSize();
  resizeCanvas(canvasWidth, canvasHeight);
}