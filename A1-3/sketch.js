// ==========================================
// 全局变量与团队成员模块声明
// ==========================================
let perlinCloud; // Part 1
let timeSunMoon; // Part 2
let audioDragon; // Part 3
let inputLantern;// Part 4

let bgImg;
let humanImg;
let underImg;

// ==========================================
// 1. 预加载 (加载你们共同的图片)
// ==========================================
function preload() {
  // 恢复了图片加载，并加入了防报错机制。
  // 请确保图片名字完全一致：地下.png, 人间.png, background.png
  loadImage(
    '地下.png',
    img => { underImg = img; },
    err => {
      underImg = null;
      console.error('地下.png 加载失败', err);
    }
  );

  loadImage(
    '人间.png',
    img => { humanImg = img; },
    err => {
      humanImg = null;
      console.error('人间.png 加载失败', err);
    }
  );

  loadImage(
    'background.png',
    img => { bgImg = img; },
    err => {
      bgImg = null;
      console.error('background.png 加载失败', err);
    }
  );
}

// ==========================================
// 2. 初始化 (Setup)
// ==========================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 条件初始化：如果某个成员的类被删了，也不会导致整个程序崩溃
  perlinCloud = typeof PerlinCloud !== 'undefined' ? new PerlinCloud() : null;
  timeSunMoon = typeof TimeSunMoon !== 'undefined' ? new TimeSunMoon() : null;
  audioDragon = typeof AudioDragon !== 'undefined' ? new AudioDragon() : null;
  inputLantern = typeof InputLantern !== 'undefined' ? new InputLantern() : null;
}

// ==========================================
// 3. 绘制主循环 (Draw)
// ==========================================
function draw() {
  // 画全局背景
  if (bgImg) {
    imageMode(CORNER);
    image(bgImg, 0, 0, width, height);
  } else {
    background(30, 25, 20); // 如果没图片，显示深棕色底色
  }

  // 分配高度比例：天上占 50%，人间占 25%，地下占 25%
  let heavenHeight = height * 0.5; 
  let humanHeight = height * 0.25;
  let underHeight = height * 0.25;

  // 绘制地下部分 (y坐标 = 天上 + 人间)
  drawUnderworld(0, heavenHeight + humanHeight, width, underHeight);

  // 绘制人间部分 (y坐标 = 天上)
  drawHumanRealm(0, heavenHeight, width, humanHeight);

  // 绘制天上部分 (互动区域)
  // 将四个模块放入数组，循环绘制并分别使用 push/pop 隔离状态，确保互不干扰
  const modules = [perlinCloud, timeSunMoon, audioDragon, inputLantern];
  for (const module of modules) {
    if (module && typeof module.display === 'function') {
      push();
      module.display(0, 0, width, heavenHeight);
      pop();
    }
  }
}

// ==========================================
// 静态画面绘制函数
// ==========================================

// 将图片等比例、居中放入指定区域，防止横向溢出
function drawImageContain(img, x, y, w, h) {
  if (!img || img.width <= 0 || img.height <= 0) return;

  const scale = Math.min(w / img.width, h / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;

  push();
  imageMode(CENTER);
  image(img, x + w / 2, y + h / 2, drawW, drawH);
  pop();
}

function drawUnderworld(x, y, w, h) {
  if (underImg) {
    drawImageContain(underImg, x, y, w, h);
  }
}

function drawHumanRealm(x, y, w, h) {
  if (humanImg) {
    drawImageContain(humanImg, x, y, w, h);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ==========================================
// 团队成员各自的代码区域 (模块化)
// 每个人只需要修改自己 Class 里面的内容！
// ==========================================

// Part 1: Perlin Noise (比如：云雾)
class PerlinCloud {
  constructor() {}
  display(x, y, w, h) {
    // Part 1 的代码将写在这里
  }
}

// Part 2: Time (比如：日月交替)
class TimeSunMoon {
  constructor() {}
  display(x, y, w, h) {
    // Part 2 的代码将写在这里
  }
}

// Part 3: Audio (比如：声音控制龙)
class AudioDragon {
  constructor() {}
  display(x, y, w, h) {
    // Part 3 的代码将写在这里
  }
}

// Part 4: Input (比如：鼠标/键盘控制灯笼)
class InputLantern {
  constructor() {}
  display(x, y, w, h) {
    // Part 4 的代码将写在这里
  }
}