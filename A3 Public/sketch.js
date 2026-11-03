// ==========================================
// IDEA9103 - Awakening Heaven (Team Main Framework)
// Lead/Time-base: Haocheng Gong
// ==========================================

// --- 资源与全局画布变量 ---
let bgImg; 
let imgRatio = 1; 
let canvasWidth, canvasHeight;

// --- 沉睡/破雾 全局状态机 (供全组读取) ---
let lastActiveTime = 0;
let isIdle = true;       // true = 沉睡阶段, false = 破雾阶段
let idleThreshold = 10000; // 10秒无操作进入沉睡状态

function preload() {
  // 加载公共底图
  bgImg = loadImage('1111.png'); 
}

function setup() {
  imgRatio = bgImg.width / bgImg.height; 
  calculateCanvasSize();
  createCanvas(canvasWidth, canvasHeight);
  smooth();
  
  // TODO: 如果 Yuanze 的音频机制需要在这里加载声音或者 setup，可以写在这里
}

function draw() {
  // 1. 全局状态检测：判断用户是否超过 10 秒没有操作
  if (millis() - lastActiveTime > idleThreshold) {
    isIdle = true;
  }
  
  // 刷新背景底色
  background(40, 32, 28); 

  // ==========================================
  // 【图层 1】：底图后方的祥云 (Kristen - Perlin Noise)
  // ==========================================
  // 注：这里的祥云在最底层，如果 bgImg(1111.png) 中间是透明的，就能透出这里的云
  drawKristenClouds(isIdle);

  // ==========================================
  // 【图层 2】：公共底图与海浪 (Haocheng - Time Base)
  // ==========================================
  blendMode(BLEND); 
  image(bgImg, 0, 0, width, height);
  
  // 计算 10 秒循环进度 (0.0 到 1.0)
  let loopDuration = 10000; 
  let cycleProgress = (millis() % loopDuration) / loopDuration; 
  // 绘制底部工笔海浪
  drawStylizedWaves(cycleProgress);

  // ==========================================
  // 【图层 3】：中央空白区的神龙 (Yuanze - Audio)
  // ==========================================
  // 龙的图层必须在底图之上，但在迷雾之下
  drawYuanzeDragons(isIdle);

  // ==========================================
  // 【图层 4】：天界发光机制 (Haocheng - Time Base)
  // ==========================================
  // 只有在【破雾】状态下，日月和天钟才开始发光苏醒
  if (!isIdle) {
    let moonIntensity = cycleProgress < 0.5 ? sin(map(cycleProgress, 0, 0.5, 0, 1) * PI) : 0;
    let sunIntensity = cycleProgress >= 0.5 ? sin(map(cycleProgress, 0.5, 1.0, 0, 1) * PI) : 0;
    let bellIntensity = moonIntensity + sunIntensity;

    if (moonIntensity > 0.01) drawMoonSystem(moonIntensity);
    if (sunIntensity > 0.01) drawSunSystem(sunIntensity);
    if (bellIntensity > 0.01) drawBellHaloGlow(bellIntensity);
  }

  // ==========================================
  // 【图层 5】：沉睡阶段的厚重迷雾 (Kristen - Perlin Noise)
  // ==========================================
  // 这层雾要盖住底图和龙。当 isIdle=true 时全屏覆盖，isIdle=false 时随鼠标散开
  drawKristenFog(isIdle, mouseX, mouseY);

  // ==========================================
  // 【图层 6】：全屏鼠标交互与提灯 (Junyu - User Input)
  // ==========================================
  // 处于最高层，响应点击与滑动，绘制提灯光晕
  drawJunyuInput(isIdle, mouseX, mouseY);
}

// ==========================================
// 全局交互监听：任何鼠标动作都会打破沉睡 (破雾)
// ==========================================
function mouseMoved() {
  lastActiveTime = millis();
  isIdle = false;
}
function mousePressed() {
  lastActiveTime = millis();
  isIdle = false;
  // TODO: Junyu/Yuanze 可以在这里触发声音播放 (Resonance 共鸣阶段)
}


// ==========================================
// ⬇️ 组员开发接口区 (Placeholders) ⬇️
// ==========================================

// ☁️ Kristen (柏林噪声) - 底层祥云
function drawKristenClouds(idleState) {
  push();
  // TODO: Kristen, 在这里写你底层祥云的代码
  // 提示：可以用 noise() 生成缓慢移动的云气，作为画面的底色补充
  pop();
}

// ☁️ Kristen (柏林噪声) - 顶层遮挡迷雾
function drawKristenFog(idleState, mx, my) {
  push();
  // TODO: Kristen, 在这里写你顶层遮挡迷雾的代码
  // 提示：if(idleState) 时透明度拉满；如果为 false，在 mx, my 附近挖出透明洞
  pop();
}

// 🎵 Yuanze (音频) - 中央双龙
function drawYuanzeDragons(idleState) {
  push();
  // TODO: Yuanze, 在这里绘制中心位置的双龙，并处理音频接收
  // 提示：if(idleState) 时龙是灰白的；发声时通过 getLevel() 缩放和 rotate() 龙
  pop();
}

// 🖱️ Junyu (用户输入) - 鼠标提灯
function drawJunyuInput(idleState, mx, my) {
  push();
  // TODO: Junyu, 在这里绘制跟随鼠标的提灯光晕
  // 提示：if(idleState) 是冷蓝小光晕；为 false 是明黄大光晕。
  pop();
}


// ==========================================
// ⬇️ Haocheng 时间机制区 (保留的完美发光与海浪) ⬇️
// ==========================================

function drawMoonSystem(intensity) {
  push();
  blendMode(ADD); 
  drawBigGlow(width * 0.115, height * 0.16, width * 0.25, 240, 250, 255, intensity);
  let mColor = [240, 250, 255]; 
  let r = width * 0.085; 
  drawBigGlow(width * 0.285, height * 0.105, r, mColor[0], mColor[1], mColor[2], intensity);
  drawBigGlow(width * 0.355, height * 0.150, r, mColor[0], mColor[1], mColor[2], intensity);
  drawBigGlow(width * 0.125, height * 0.340, r, mColor[0], mColor[1], mColor[2], intensity);
  drawBigGlow(width * 0.050, height * 0.410, r, mColor[0], mColor[1], mColor[2], intensity);
  drawBigGlow(width * 0.180, height * 0.470, r, mColor[0], mColor[1], mColor[2], intensity);
  drawBigGlow(width * 0.245, height * 0.545, r, mColor[0], mColor[1], mColor[2], intensity);
  pop();
}

function drawSunSystem(intensity) {
  push();
  blendMode(ADD);
  drawBigGlow(width * 0.905, height * 0.145, width * 0.25, 255, 50, 20, intensity);
  let sColor = [255, 50, 20]; 
  let r = width * 0.085;
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
    let alpha = sin(progress * PI) * 55 * intensity;
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

// ==========================================
// 辅助函数：窗口自适应
// ==========================================
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