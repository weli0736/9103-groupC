// ============================================
// sketch.js —— 团队共用的基础框架（白色平台重叠版）
// 大家不要在这个文件里写自己的功能代码！
// 每个人的代码写在自己的 part1.js ~ part4.js 里
// ============================================

// 固定一屏的 Heaven 画布。
let bgImg;
let cloudImg;
let cloudStatus = 'loading';
let bgStatus = 'loading';
const BACKGROUND_GRAIN_STRENGTH = 24; // 噪点强度，数值越大颗粒越明显。
let part1, part2, part3, part4;
let heavenTop = 0;
let earthTop = 0;

function updateHeavenLayout() {
  heavenTop = 0;
  earthTop = height;
}

function preload() {
  cloudImg = loadImage('photo/cloud.png',
    () => { cloudStatus = 'ok'; },
    () => { cloudStatus = 'fail'; console.error('cloud.png 加载失败，请检查 photo/cloud.png'); });
  bgImg = loadImage('photo/background.png',
    () => { bgStatus = 'ok'; },
    () => { bgStatus = 'fail'; });
}
// 只处理背景的内存副本一次，保留原文件和透明通道，避免逐帧闪烁。
function addBackgroundGrain() {
  if (bgStatus !== 'ok') return;
  bgImg.loadPixels();
  for (let i = 0; i < bgImg.pixels.length; i += 4) {
    if (bgImg.pixels[i + 3] === 0) continue;
    const grain = (Math.random() * 2 - 1) * BACKGROUND_GRAIN_STRENGTH;
    for (let channel = 0; channel < 3; channel++) {
      bgImg.pixels[i + channel] = Math.max(0, Math.min(255, bgImg.pixels[i + channel] + grain));
    }
  }
  bgImg.updatePixels();
}

function setup() {
  addBackgroundGrain();
  // ---------- 画布尺寸 ----------
  // 宽度：最大 800px，跟随窗口宽度
  // 高度：固定为窗口高度
  let canvasW = min(windowWidth, 800);
  let canvasH = windowHeight;

  let cnv = createCanvas(canvasW, canvasH);
  cnv.style('display', 'block');
  cnv.style('margin', '0 auto');
  updateHeavenLayout();

  // ---------- 实例化四个人的模块 ----------
  // typeof 检查的作用：就算某个组员的文件还没写完或没提交，
  // 整个程序也不会报错崩溃，其他人的部分照常运行
  part1 = typeof Part1 !== 'undefined' && cloudStatus === 'ok' ? new Part1(cloudImg) : null;
  part2 = typeof Part2 !== 'undefined' ? new Part2() : null;
  part3 = typeof Part3 !== 'undefined' ? new Part3() : null;
  part4 = typeof Part4 !== 'undefined' ? new Part4() : null;

  // ---------- 点击声音和双龙反馈（audio-change.js） ----------
  if (typeof setupAudioChange === 'function') setupAudioChange();
}

function draw() {
  if (typeof updateMusic === 'function') updateMusic();
  background(0);

  // ========== 第一层：Heaven 背景 ==========
  // 背景铺满固定画布。


  // 1. 背景图：铺满整个画布
  if (bgStatus === 'ok' && bgImg.width > 0) {
    push();
    tint(255, 140); // 背景图以 55% 不透明度叠在纯黑底色上。
    image(bgImg, 0, 0, width, height);
    pop();
  } else {
    drawErrorBox(0, 0, width, height,
      'background.png 加载失败!\n请检查: photo/background.png');
  }

  // Heaven 模块。
  if (part1) {
    part1.update();
    part1.display();
  }

  if (part2) {
    part2.update();
    part2.display();
  }

  // 双龙后于云雾绘制：使用 perlin-noise.js 或 perlin-noise2.js 时均在云层上方。
  if (typeof drawHeavenDragons === 'function') drawHeavenDragons();

  if (part3) {
    part3.update();
    part3.display();
  }

  if (part4) {
    part4.update();
    part4.display();
  }

  // 显示点击声音/当前阶段提示（audio-change.js）
  if (typeof drawMusicHint === 'function') drawMusicHint();
}

// ---------- 自动排错工具：画一个红色提示框 ----------
// 哪张图片加载失败，画面上就会出现红框和文字提示
function drawErrorBox(x, y, w, h, msg) {
  push();
  fill(255, 0, 0, 40);
  stroke(255, 0, 0);
  strokeWeight(2);
  rect(x + 5, y + 5, w - 10, h - 10);

  noStroke();
  fill(200, 0, 0);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(msg, x + w / 2, y + h / 2);
  pop();
}

function windowResized() {
  let canvasW = min(windowWidth, 800);
  let canvasH = windowHeight;
  resizeCanvas(canvasW, canvasH);
  if (part1) part1.resize();
  updateHeavenLayout();
}