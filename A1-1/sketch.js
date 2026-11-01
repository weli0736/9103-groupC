// ============================================
// sketch.js —— 团队共用的基础框架（白色平台重叠版）
// 大家不要在这个文件里写自己的功能代码！
// 每个人的代码写在自己的 part1.js ~ part4.js 里
// ============================================

// ---------- 三张共用图片 ----------
let bgImg;          // 背景图（铺满整个画布）
let earthImg;       // 人间图
let undergroundImg; // 地下图

// ---------- 图片加载状态记录（用于自动排错） ----------
// 'loading' = 加载中, 'ok' = 成功, 'fail' = 失败
let bgStatus = 'loading';
let earthStatus = 'loading';
let undergroundStatus = 'loading';

// ---------- 四个人的模块实例 ----------
let part1, part2, part3, part4;

// ============================================
// 布局设置（想微调就改这几个数字）
// ============================================

// 画布高度 = 窗口高度 × 这个倍数（越大画布越长，页面可以滚动）
const CANVAS_HEIGHT_MULTIPLIER = 2.5;

// 顶部留空比例：画布最上方 30% 留给"天上（Heaven）"
// （现在 earth 不再由这条线决定位置，这个值只用来提示 Heaven 的绘制区域）
const HEAVEN_RATIO = 0.30;

// ★★★ 重叠微调旋钮 ★★★
// overlapOffset = earth 和 underground 重叠的像素数
// 改大 = 重叠更多（earth 往下压进 underground）
// 改小 = 重叠更少
// 改成 0 = 两张图只是贴在一起，不重叠
// 你可以一次改 10~20 慢慢试，直到两个白色平台完全重合
let overlapOffset = 270;

// ★★★ 上下留白 ★★★（单位：像素，背景图不受影响，仍然铺满整个画布）
// MARGIN_BOTTOM：underground 底边离画布最底端的距离（改大 = 三个部分整体上移更多）
// MARGIN_TOP：Heaven 区域上方留出的空白（Heaven 的内容建议画在 heavenTop 以下）
const MARGIN_TOP = 200;
const MARGIN_BOTTOM = 200;

// 三个区域的位置（每帧在 draw() 里更新），组员画画时可以直接用：
// heavenTop ~ earthTop 是天上，earthTop ~ underTop 是人间，underTop ~ underBottom 是地下
let heavenTop = MARGIN_TOP;
let earthTop = 0;
let underTop = 0;
let underBottom = 0;

function preload() {
  // 每张图都带成功/失败的回调，失败也不会让程序崩溃
  bgImg = loadImage(
    'photo/background.png',
    function () { bgStatus = 'ok'; },
    function () { bgStatus = 'fail'; }
  );

  earthImg = loadImage(
    'photo/earth.png',
    function () { earthStatus = 'ok'; },
    function () { earthStatus = 'fail'; }
  );

  undergroundImg = loadImage(
    'photo/underground.png',
    function () { undergroundStatus = 'ok'; },
    function () { undergroundStatus = 'fail'; }
  );
}

function setup() {
  // ---------- 画布尺寸 ----------
  // 宽度：最大 800px，跟随窗口宽度
  // 高度：窗口高度 × 1.8 → 页面可以向下滚动
  let canvasW = min(windowWidth, 800);
  let canvasH = windowHeight * CANVAS_HEIGHT_MULTIPLIER;

  let cnv = createCanvas(canvasW, canvasH);
  cnv.style('display', 'block');
  cnv.style('margin', '0 auto');

  // ---------- 实例化四个人的模块 ----------
  // typeof 检查的作用：就算某个组员的文件还没写完或没提交，
  // 整个程序也不会报错崩溃，其他人的部分照常运行
  part1 = typeof Part1 !== 'undefined' ? new Part1() : null;
  part2 = typeof Part2 !== 'undefined' ? new Part2() : null;
  part3 = typeof Part3 !== 'undefined' ? new Part3() : null;
  part4 = typeof Part4 !== 'undefined' ? new Part4() : null;

  // ---------- 窗口跟随鼠标移动 + 背景音乐（代码在 audio-change.js） ----------
  if (typeof setupAudioChange === 'function') setupAudioChange();
}

function draw() {
  // 根据鼠标位置移动窗口（audio-change.js）
  if (typeof updateMouseScroll === 'function') updateMouseScroll();
  background(240, 235, 225);

  // ========== 第一层：三张共用图片 ==========
  // 绘制顺序：先背景 → 再人间 → 最后地下
  // 后画的在上层，所以背景绝对不会盖住另外两张

  // 1. 背景图：铺满整个画布
  if (bgStatus === 'ok' && bgImg.width > 0) {
    image(bgImg, 0, 0, width, height);
  } else {
    drawErrorBox(0, 0, width, height,
      'background.png 加载失败!\n请检查: photo/background.png');
  }

  // ---------- 布局计算 ----------

  // 天上（Heaven）区域：从顶部留白下方开始，到 height × 0.30
  // 这里故意什么都不画，留给之后的 Heaven 部分
  let heavenBottom = MARGIN_TOP + height * HEAVEN_RATIO;

  // ---------- 第一步：先算 underground 的位置 ----------
  // 宽 = 画布宽度，高 = 按图片原始比例算出来
  // underY = 画布高度 - 底部留白 - 图片显示高度 → 底边离画布底端 MARGIN_BOTTOM 像素
  let underBottomY = height - MARGIN_BOTTOM;
  let underH = 0;
  let underY = underBottomY; // 如果图片加载失败，就当它的顶边在底部留白的上方
  if (undergroundStatus === 'ok' && undergroundImg.width > 0) {
    underH = width * (undergroundImg.height / undergroundImg.width);
    underY = underBottomY - underH;
  }

  // ---------- 第二步：把 earth 挂在 underground 上面 ----------
  // ★ 核心公式 ★
  // earthY = underground顶边 - earth的高度 + 重叠像素数
  // 这样 earth 的底边会压进 underground 顶部 overlapOffset 像素
  // → 两个白色平台就能叠在一起，而且窗口大小变了也不会分开
  let earthH = 0;
  let earthY = heavenBottom; // 图片加载失败时的备用位置
  if (earthStatus === 'ok' && earthImg.width > 0) {
    earthH = width * (earthImg.height / earthImg.width);
    earthY = underY - earthH + overlapOffset;
  }

  // 把三个区域的位置同步给全局变量，方便组员使用
  heavenTop = MARGIN_TOP;
  earthTop = earthY;
  underTop = underY;
  underBottom = underBottomY;

  // 2. 画人间图（earth）
  if (earthStatus === 'ok' && earthImg.width > 0) {
    image(earthImg, 0, earthY, width, earthH);
  } else {
    drawErrorBox(0, heavenBottom, width, height * 0.2,
      'earth.png 加载失败!\n请检查: photo/earth.png\n(注意后缀是不是 .jpg? 大小写对吗?)');
  }

  // 3. 画地下图（underground）：底边离画布最底端 MARGIN_BOTTOM 像素
  // 注意：underground 在 earth 之后画，所以重叠的部分由 underground 盖在上层
  if (undergroundStatus === 'ok' && undergroundImg.width > 0) {
    image(undergroundImg, 0, underY, width, underH);
  } else {
    drawErrorBox(0, underBottomY - height * 0.15, width, height * 0.15,
      'underground.png 加载失败!\n请检查: photo/underground.png\n(注意后缀是不是 .jpg? 大小写对吗?)');
  }

  // ========== 第二层：四个人的模块，按顺序调用 ==========
  // 每个模块必须有 update() 和 display() 两个方法
  // 提示：负责"天上（Heaven）"的同学，可以把内容画在
  // y = heavenTop 到 y = earthTop 这个区域里（上面 MARGIN_TOP 像素是留白）

  if (part1) {
    part1.update();
    part1.display();
  }

  if (part2) {
    part2.update();
    part2.display();
  }

  if (part3) {
    part3.update();
    part3.display();
  }

  if (part4) {
    part4.update();
    part4.display();
  }

  // ========== 第三层：背景音乐（audio-change.js） ==========
  if (typeof updateMusic === 'function') {
    updateMusic();
    drawMusicHint();
  }
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
  let canvasH = windowHeight * CANVAS_HEIGHT_MULTIPLIER;
  resizeCanvas(canvasW, canvasH);
}
