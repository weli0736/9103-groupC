/// ============================================
// part1.js —— Part1：Perlin Noise 云纹模块
// 作者：（写你的名字）
//
// 模块接口（团队标准）：
//   new Part1()   → 创建（自动跟随 sketch.js 的天上区域）
//   update()      → 每帧更新（会自动检测区域变化并重建）
//   display()     → 每帧绘制
//   onResize()    → 保留的兼容接口（不调用也没关系，模块会自己适应）
//
// 透明说明：
//   小画布只用 clear()，没有任何 background()，
//   所以没有线条的地方是 100% 透明，能直接看到下面的背景图
// ============================================

// ---------- 云纹设置（微调都改这里） ----------

// ★★★ 位置旋钮 ★★★
// 云区域顶边 = heavenTop + CLOUD_OFFSET_Y
// 负数 = 整体往上移（比如 -100、-150），正数 = 往下移
// 往上移最多到画布最顶端（y = 0），不会跑出画布
const CLOUD_OFFSET_Y = -150;

// ★★★ 透明度相关 ★★★
const CLOUD_ALPHA = 90;          // 线条本身的透明度（0~255），越大越明显
const CLOUD_FADE = 20;           // 旧线条淡出速度 ★改大 = 消散快，底色干净透明★
                                 // 如果还觉得有"雾蒙蒙的底色"，继续调大到 30~40
                                 // 如果想要更浓的云雾感，就调小（但太小会糊成一片）

const CLOUD_HEAVEN_RATIO = 0.30; // 云最多占画布高度的比例
const CLOUD_COUNT = 500;         // 云线条的数量，越大云越浓密
const CLOUD_FACTOR = 0.005;      // 噪音弯曲程度，越小线条越平滑舒展
const CLOUD_SPEED = 1.2;         // 线条流动的速度
const CLOUD_WEIGHT = 3;          // 线条粗细

// 汉代云纹配色：砖红、青绿、土金、米白
const CLOUD_PALETTE = [
  [168, 74, 47],    // 砖红 Terracotta
  [64, 120, 110],   // 青绿 Teal
  [196, 160, 98],   // 土金 Gold
  [235, 230, 220]   // 米白 Beige
];

// ============================================
// Part1 主类
// 原理：
// 1. 用 createGraphics() 做一个单独的透明小画布（只有云区域那么大）
// 2. 几百个小点用柏林噪音控制方向，在小画布里流动画线
// 3. 点跑出区域就立刻重生 → 云绝对不会越界盖住人间和地下
// 4. 每帧用 erase() 把旧线条擦淡 → 没有线条的地方始终是透明的
// ============================================

class Part1 {
  // 不传参数 → 自动跟随 sketch.js 的天上区域（团队项目里就这样用）
  // 传参数 → 固定区域模式（独立测试时用，云铺满你指定的区域）
  constructor(areaW, areaH) {
    this.fixed = (areaW !== undefined); // 是否为固定区域模式

    if (this.fixed) {
      this.areaW = areaW;
      this.areaH = areaH;
      this.areaY = 0;
    } else {
      this.areaW = width;
      this.areaY = this.calcAreaY();
      this.areaH = this.calcAreaH();
    }

    this.buildCanvas();
  }

  // ---------- 计算云区域的起点 y ----------
  // = heavenTop + 位置旋钮，但最高不超过画布顶端（y = 0）
  calcAreaY() {
    let base = (typeof heavenTop !== 'undefined') ? heavenTop : 0;
    return max(0, base + CLOUD_OFFSET_Y);
  }

  // ---------- 计算云区域的高度 ----------
  // 最多是画布高度的 30%，但底边绝不超过 earthTop（不压到人间）
  calcAreaH() {
    let h = height * CLOUD_HEAVEN_RATIO;
    if (typeof earthTop !== 'undefined' && earthTop > this.areaY) {
      h = min(h, earthTop - this.areaY);
    }
    return h;
  }

  // ---------- 重建小画布和所有小点 ----------
  buildCanvas() {
    this.pg = createGraphics(ceil(this.areaW), ceil(this.areaH));
    this.pg.clear(); // 透明底！这里绝对不要用 background()

    this.dots = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      this.dots.push(new CloudDot(this.areaW, this.areaH));
    }
  }

  update() {
    // ---------- 自动适应：检查区域有没有变化 ----------
    if (!this.fixed) {
      this.areaY = this.calcAreaY(); // 起点变了只需换贴图位置，不用重建
      let newW = width;
      let newH = this.calcAreaH();

      // 宽或高变了超过 1 像素才重建（避免每帧重建浪费性能）
      if (abs(newW - this.areaW) > 1 || abs(newH - this.areaH) > 1) {
        this.areaW = newW;
        this.areaH = newH;
        this.buildCanvas();
      }
    }

    // ---------- 把旧线条擦淡（擦掉的地方恢复成透明，不是涂颜色） ----------
    this.pg.erase(CLOUD_FADE);
    this.pg.noStroke();
    this.pg.rect(0, 0, this.areaW, this.areaH);
    this.pg.noErase();

    // ---------- 更新每个点，并把新的线段画进小画布 ----------
    for (let i = 0; i < this.dots.length; i++) {
      this.dots[i].update();
      this.dots[i].draw(this.pg);
    }
  }

  display() {
    // 把透明的云纹小画布贴到计算好的位置
    image(this.pg, 0, this.areaY);
  }

  // 兼容接口：强制重建一次
  onResize() {
    if (this.fixed) return;
    this.areaW = width;
    this.areaY = this.calcAreaY();
    this.areaH = this.calcAreaH();
    this.buildCanvas();
  }
}

// ---------- 云线条的小点 ----------
class CloudDot {
  constructor(areaW, areaH) {
    this.areaW = areaW;
    this.areaH = areaH;
    this.spawn();
  }

  // 在区域内随机重生，并随机选一个汉代配色
  spawn() {
    this.pos = createVector(random(this.areaW), random(this.areaH));
    this.prev = this.pos.copy();
    let c = random(CLOUD_PALETTE);
    this.col = color(c[0], c[1], c[2], CLOUD_ALPHA);
  }

  update() {
    // 柏林噪音决定流动方向（第三个参数让云随时间慢慢变化）
    let n = noise(
      this.pos.x * CLOUD_FACTOR,
      this.pos.y * CLOUD_FACTOR,
      frameCount * 0.002
    );
    let v = p5.Vector.fromAngle(n * TWO_PI * 2);
    v.setMag(CLOUD_SPEED);

    this.prev = this.pos.copy();
    this.pos.add(v);

    // ★ 越界检查：跑出区域就立刻重生 ★
    if (
      this.pos.x < 0 || this.pos.x >= this.areaW ||
      this.pos.y < 0 || this.pos.y >= this.areaH
    ) {
      this.spawn();
    }
  }

  draw(pg) {
    pg.stroke(this.col);
    pg.strokeWeight(CLOUD_WEIGHT);
    pg.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}