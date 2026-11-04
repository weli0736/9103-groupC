
 // =============================================================
 // IDEA9103 - Main Sketch (Global Dispatcher)
 // Lead/Time-base: Haocheng Gong
 // =============================================================

let bgBase, bgElements;
let yutuImg, jinwuImg;

// 引入你的两个模块实例
let timebase2, timebase1;

// 交互与闲置状态管理
let lastActiveTime = 0;
let isIdle = true;
let idleThreshold = 10000;

function preload() {
  // 统一从 photo/ 文件夹加载资源，加入报错提示
  bgBase = loadImage('photo/bg1.png', null, () => console.error('找不到 bg1.png'));
  bgElements = loadImage('photo/bg2.png', null, () => console.error('找不到 bg2.png'));
  yutuImg = loadImage('photo/yutu1.png', null, () => console.error('找不到 yutu1.png'));
  jinwuImg = loadImage('photo/jinwu1.png', null, () => console.error('找不到 jinwu1.png'));
}

function setup() {
  // 画布尺寸严格对齐底层背景图
  createCanvas(bgBase.width, bgBase.height);
  smooth();
  frameRate(60);

  // 初始化 Yuanze 的音频系统 (若存在)
  if (typeof setupAudioChange === 'function') {
    setupAudioChange();
  }

  // 初始化你的时间基底模块
  timebase2 = new TimeBase2Module(width, height);
  timebase1 = new TimeBase1Module(width, height);

  // Junyu: initialize User Input lantern
  if (typeof setupJunyuLantern === 'function') {
    setupJunyuLantern();
  }
}

function draw() {
  // 1. 全局闲置状态检测
  if (millis() - lastActiveTime > idleThreshold) {
    isIdle = true;
  }

  // 2. 刷新音频状态
  if (typeof updateMusic === 'function') {
    updateMusic();
  }

  background(40, 32, 28);

  // ==========================================
  // 【图层 1】：底层纯背景肌理 (bg1)
  // ==========================================
  blendMode(BLEND);
  imageMode(CORNER);
  image(bgBase, 0, 0, width, height);

  // ==========================================
  // 【图层 2】：Kristen 的底层背景祥云流动
  // ==========================================
  if (typeof drawKristenClouds === 'function') {
    drawKristenClouds(isIdle);
  }

  // ==========================================
  // 【图层 3】：timebase-2 (迷雾下方的底画：bg2、海浪、树果实、钟光效)
  // ==========================================
  timebase2.display(bgElements);

  // ==========================================
  // 【图层 4】：Yuanze 的神龙 (夹在迷雾和背景之间)
  // ==========================================
  imageMode(CENTER);
  drawYuanzeDragons(isIdle);

  // ==========================================
  // 【图层 5】：Kristen 的全屏厚重迷雾 (Fog)
  // ==========================================
  if (typeof drawKristenFog === 'function') {
    drawKristenFog(isIdle, mouseX, mouseY);
  }

  // ==========================================
  // 【图层 6】：timebase-1 (迷雾上层的日月循环，联动迷雾消散)
  // ==========================================
  timebase1.display();

  // ==========================================
  // 【图层 7】：Junyu 的鼠标交互长信宫灯
  // ==========================================
  if (typeof drawJunyuLantern === 'function') {
    drawJunyuLantern(isIdle);
  }

  // ==========================================
  // 【图层 8】：交互提示文字 (Yuanze - Audio)
  // ==========================================
  if (typeof drawMusicHint === 'function') {
    drawMusicHint();
  }
}

// ==========================================
// 全局交互监听 (唤醒画卷与敲钟)
// ==========================================
function mouseMoved() {
  lastActiveTime = millis();
  isIdle = false;
}

function mouseDragged() {
  // 防止长按拖动被判定为闲置
  lastActiveTime = millis();
  isIdle = false;
}

function mousePressed() {
  // 检测是否敲击天钟以触发音乐切换
  if (typeof YuanzeAudio !== 'undefined' && typeof YuanzeAudio.isBellHit === 'function') {
    if (!YuanzeAudio.isBellHit(mouseX, mouseY)) return;
  }
  lastActiveTime = millis();
  isIdle = false;
}

// ==========================================
// ⬇️ 组员模块钩子占位符 (防止未加载时报错) ⬇️
// ==========================================
function drawYuanzeDragons(idleState) {
  if (typeof YuanzeAudio !== 'undefined' && typeof YuanzeAudio.setIdle === 'function') {
    YuanzeAudio.setIdle(idleState);
  }
  if (typeof drawHeavenDragons === 'function') {
    drawHeavenDragons();
  }
}
