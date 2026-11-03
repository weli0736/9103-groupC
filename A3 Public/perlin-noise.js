// =============================================================
//  perlin-noise.js · Kristen · 天界祥云层 (Part1)
//  ① 月白浓雾：全屏 Perlin 噪声雾，鼠标移动 → 慢慢散开；isIdle → 合拢
//  ② 云纹：原版 CloudDot 效果（铺满全屏），按 cloud.png 纹路生成，雾散开后露出
//  接入 Haocheng 框架：
//    drawKristenClouds() → 图层 2（bg1 之上、bg2 之下）
//    drawKristenFog()    → 图层 7（日月光效之上、提灯之下）
//  index.html 里必须放在 sketch.js 之后加载
// =============================================================


// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
//  可调参数区 —— 平时只需要改这里
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

// ===== ① 浓雾参数 =====
const P1_FOG = {
  // —— 雾的颜色 ——
  FOG_ALPHA: 245,                 // 雾的不透明度（255 = 完全挡住；降到 225 能透出一点背景）
  FOG_DARK: 186,                  // 雾暗部亮度（越大越白）
  FOG_LIGHT: 250,                 // 雾亮部亮度
  FOG_CONTRAST: 1.25,             // 云团明暗对比（1 = 原样，越大层次越明显）
  FOG_TINT: [1.0, 0.985, 0.945],  // 色调 R/G/B 系数：蓝色略低 → 暖白
                                  //   更暖米金：[1.0, 0.97, 0.9]
                                  //   冷月光白：[0.97, 0.985, 1.0]
  RIM_LIGHT: 26,                  // 撕开边缘的提亮
  RIM_GOLD: [232, 204, 150],      // 撕开边缘泛出的淡金色
  RIM_GOLD_MIX: 0.45,             // 淡金混合比例（0 = 不要金边）
  FADE_POWER: 1.8,                // 散开处雾退得多干净（越大越不留灰纱）

  // —— 雾的形态 ——
  CELL: 8,                        // 雾网格像素，越大越省性能、越柔
  FOG_EVERY: 2,                   // 每几帧重算一次雾纹理
  FOG_SCALE: 0.045,               // 雾团大小（越小越大团）
  FOG_SPEED: 0.0035,              // 雾流动速度

  // —— 散开 / 合拢 ——
  REVEAL_PER_PX: 0.00045,         // 鼠标每移动 1px 增加的散开量（越小要晃越久）
  REVEAL_SPEED: 0.0035,           // 每帧最多散开多少（越小越慢；0.002 ≈ 10 秒全散）
  EDGE: 0.16,                     // 散开边缘的柔和宽度
  DIST_WEIGHT: 0.55,              // 0 = 随机斑块散开；1 = 纯圆形从提灯向外扩
  CLOSE_SECONDS: 5,               // isIdle 后多少秒盖满（越大合得越慢）
  IDLE_MS: 10000,                 // 仅备用计时使用
};

// ===== ② 云纹参数（与原版一致，只改了铺满全屏）=====
const P1_CLOUD = {
  GUIDE_SRC: 'cloud.png', // [框架接入] 云纹图片路径

  OFFSET_Y: 0,            // 从画面顶部开始
  HEAVEN_RATIO: 1,        // 1 = 铺满整个画布高度

  SPEED: 1.0,
  FADE: 2,
  FADE_EVERY: 8,          // [底纹修正] 每 8 帧集中擦一次（总量不变），残影才能消干净
  LIFE: 900,
  PULL: 0.12,             // 吸回线上的力度（越大贴得越紧）
  GRACE: 8,               // 离线多少帧后重生
  THRESHOLD: 100,

  NOISE_SCALE: 0.01,      // 粒子摆动
  NOISE_SPEED: 0.005,
  NOISE_TURN: 0.08,

  ALPHA: 70,
  WEIGHT: 4,
  COUNT: 3000,            // 铺满全屏后保持密度；电脑卡就降到 2000

  // [底纹修正] 垫在下面的淡云纹（直接由 cloud.png 生成）
  BASE_ALPHA: 0.12,               // 底纹深浅：0 = 不要底纹，0.12 很淡，0.25 明显
  BASE_COLOR: [205, 175, 125],    // 底纹颜色（淡金褐，和棕底融合）

  // 云纹自身的显隐（原版的浓度场，让云纹一块块浮现/隐去）
  FOG_SCALE: 0.004,
  FOG_SPEED: 0.002,
  FOG_LOW: 0.35,
  FOG_HIGH: 0.65,

  // [淡化白纹] 每种颜色：[R, G, B, 透明度倍数, 粗细倍数]
  PALETTE: [
    [196, 160, 98, 1.0, 1.0],   // 鎏金
    [230, 200, 140, 1.0, 1.0],  // 亮金
    [235, 230, 220, 0.3, 0.6],  // 月白（淡化）
  ],
};

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
//  以下是功能代码，一般不需要改
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★


class Part1 {
  constructor(cloudImg, options = {}) {
    this.cfg = Object.assign({}, P1_FOG, options);

    this.cloudImg = cloudImg;   // [框架接入] 可以先是 null，加载好后由 setCloudImage() 补上
    this.pg = null;             // [框架接入]
    this.basePg = null;         // [底纹修正] 淡底纹图层
    this.guide = null;          // [框架接入]
    this.dots = [];             // [框架接入]
    this.w = width;             // [框架接入] 记录尺寸，用于自动检测缩放
    this.h = height;            // [框架接入]

    this.revealMax = 1 + this.cfg.EDGE;
    this.reveal = 0;
    this.revealTarget = 0;
    this.ox = width / 2;
    this.oy = height / 2;
    this.lastActive = -Infinity;
    this.fullyClosed = true;

    this._buildFogGrid();
    this._buildCloud();
    this._renderFog();      // [框架接入] 第一帧就是满屏雾
  }

  // [框架接入] cloud.png 异步加载完成后调用
  setCloudImage(img) {
    this.cloudImg = img;
    this._buildCloud();
  }

  resize() {
    this.w = width;
    this.h = height;
    this.fogG.remove();
    this.ox = width / 2;
    this.oy = height / 2;
    this.reveal = this.revealTarget = 0;
    this.fullyClosed = true;
    this._buildFogGrid();
    this._buildCloud();
    this._renderFog();
  }

  // ---------------------------------------------------------- 主循环
  update(idleState) {
    if (width !== this.w || height !== this.h) this.resize();   // [框架接入]

    const c = this.cfg;
    const inside = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
    const mv = inside ? Math.min(60, dist(mouseX, mouseY, pmouseX, pmouseY)) : 0;
    if (mv > 0.5 || mouseIsPressed) this.lastActive = millis();

    const idle = (typeof idleState === 'boolean') ? idleState : this._readIdle();

    if (!idle) {
      if (mv > 0.5) {
        this.revealTarget = Math.min(this.revealMax, this.revealTarget + mv * c.REVEAL_PER_PX);
        this.ox = mouseX;
        this.oy = mouseY;
      }
      this.reveal = Math.min(this.revealTarget, this.reveal + c.REVEAL_SPEED);
      this._applyMask(true);
      this.fullyClosed = false;
    } else if (!this.fullyClosed) {
      this.reveal = Math.max(0, this.reveal - this.revealMax / (c.CLOSE_SECONDS * 60));
      this.revealTarget = this.reveal;
      this._applyMask(false);
      if (this.reveal === 0) {
        this.mask.fill(0);
        this.fullyClosed = true;
      }
    }

    if (this.pg) this._updateCloud();
    if (frameCount % c.FOG_EVERY === 0 || frameCount < 3) this._renderFog();
  }

  displayCloud() {
    if (!this.pg) return;
    push();
    blendMode(BLEND); imageMode(CORNER); noTint();
    if (this.basePg) image(this.basePg, 0, this.areaY);   // [底纹修正] 先画淡底纹
    image(this.pg, 0, this.areaY);                        // 再画金色粒子
    pop();
  }

  displayFog() {
    const c = this.cfg;
    push();
    blendMode(BLEND); imageMode(CORNER); noTint();
    image(this.fogG, -c.CELL / 2, -c.CELL / 2,
          this.cols * c.CELL, this.rows * c.CELL);
    pop();
  }

  display() {
    this.displayCloud();
    this.displayFog();
  }

  _readIdle() {
    if (typeof isIdle !== 'undefined') return !!isIdle;
    return millis() - this.lastActive > this.cfg.IDLE_MS;
  }

  // ========================================================== ① 浓雾
  _buildFogGrid() {
    const c = this.cfg;
    this.cols = Math.ceil(width / c.CELL) + 1;
    this.rows = Math.ceil(height / c.CELL) + 1;
    const n = this.cols * this.rows;
    this.mask = new Float32Array(n);
    this.grain = new Float32Array(n);
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const v = noise(i * 0.11 + 300, j * 0.11 + 300) * 0.7 +
                  noise(i * 0.35 + 500, j * 0.35 + 500) * 0.3;
        this.grain[j * this.cols + i] = constrain((v - 0.28) / 0.44, 0, 1);
      }
    }
    this.fogG = createGraphics(this.cols, this.rows);
    this.fogG.pixelDensity(1);
    this.maxD = dist(0, 0, width, height) * 0.8;
  }

  _applyMask(open) {
    const c = this.cfg, cols = this.cols, inv = 1 / c.EDGE;
    const dw = c.DIST_WEIGHT, gw = 1 - dw;
    for (let j = 0; j < this.rows; j++) {
      const dy = j * c.CELL - this.oy;
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const dx = i * c.CELL - this.ox;
        const dn = Math.min(1, Math.sqrt(dx * dx + dy * dy) / this.maxD);
        const f = dw * dn + gw * this.grain[k];
        let v = (this.reveal - f) * inv;
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        if (open ? v > this.mask[k] : v < this.mask[k]) this.mask[k] = v;
      }
    }
  }

  _renderFog() {
    const c = this.cfg, g = this.fogG, cols = this.cols;
    const t = frameCount * c.FOG_SPEED;
    const [tr, tg, tb] = c.FOG_TINT;
    const [gr, gg, gb] = c.RIM_GOLD;
    g.loadPixels();
    const px = g.pixels;
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i, idx = k * 4;
        const m = this.mask[k];
        const s = m * m * (3 - 2 * m);
        const a = c.FOG_ALPHA * Math.pow(1 - s, c.FADE_POWER);
        if (a < 1) { px[idx + 3] = 0; continue; }

        const x = i * c.FOG_SCALE, y = j * c.FOG_SCALE * 1.6;
        const w = noise(x * 0.5 + t, y * 0.5 - t * 0.5, 7.3);
        let v = noise(x + w * 2 - t * 0.6, y + w * 1.2, t) * 0.65 +
                noise(x * 2.3 + 40, y * 2.3, t * 1.5) * 0.35;
        v = constrain((v - 0.25) / 0.5, 0, 1);
        v = constrain(0.5 + (v - 0.5) * c.FOG_CONTRAST, 0, 1);

        const rim = 4 * m * (1 - m);
        const lum = c.FOG_DARK + (c.FOG_LIGHT - c.FOG_DARK) * v + rim * c.RIM_LIGHT;

        let r = lum * tr, gch = lum * tg, b = lum * tb;
        const gm = rim * c.RIM_GOLD_MIX;
        r   += (gr - r)   * gm;
        gch += (gg - gch) * gm;
        b   += (gb - b)   * gm;

        px[idx]     = r;
        px[idx + 1] = gch;
        px[idx + 2] = b;
        px[idx + 3] = a;
      }
    }
    g.updatePixels();
  }

  // ========================================================== ② 云纹（原版）
  _buildCloud() {
    if (!this.cloudImg) return;

    const C = P1_CLOUD;
    const base = (typeof heavenTop !== 'undefined') ? heavenTop : 0;
    this.areaY = Math.max(0, base + C.OFFSET_Y);
    let h = height * C.HEAVEN_RATIO;
    if (typeof earthTop !== 'undefined' && earthTop > this.areaY) {
      h = Math.min(h, earthTop - this.areaY);
    }
    this.areaW = width;
    this.areaH = h;

    const w = Math.ceil(this.areaW), hh = Math.ceil(this.areaH);
    if (this.pg) this.pg.remove();
    this.pg = createGraphics(w, hh);
    this.pg.clear();

    this.guide = createImage(w, hh);
    this.guide.copy(this.cloudImg, 0, 0, this.cloudImg.width, this.cloudImg.height, 0, 0, w, hh);
    this.guide.loadPixels();

    this._buildBase(w, hh);   // [底纹修正]

    this.dots = [];
    for (let i = 0; i < C.COUNT; i++) this.dots.push(new P1CloudDot(this));
  }

  // [底纹修正] 用 cloud.png 的纹路生成一层淡底纹，只在建立时算一次，不占每帧性能
  _buildBase(w, hh) {
    const C = P1_CLOUD;
    if (this.basePg) { this.basePg.remove(); this.basePg = null; }
    if (C.BASE_ALPHA <= 0) return;

    const bp = createGraphics(w, hh);
    bp.pixelDensity(1);
    bp.loadPixels();
    const src = this.guide.pixels, dst = bp.pixels;
    const [cr, cg, cb] = C.BASE_COLOR;
    for (let k = 0; k < w * hh; k++) {
      const o = k * 4;
      const bri = (src[o] + src[o + 1] + src[o + 2]) / 3;
      let d = (255 - bri) * (src[o + 3] / 255) / 255;   // 0 = 空白，1 = 墨线
      d = constrain((d - 0.2) / 0.6, 0, 1);               // 只保留线条
      dst[o] = cr; dst[o + 1] = cg; dst[o + 2] = cb;
      dst[o + 3] = 255 * C.BASE_ALPHA * d;
    }
    bp.updatePixels();
    this.basePg = bp;
  }

  _updateCloud() {
    const C = P1_CLOUD;
    // [底纹修正] 集中擦除：每 FADE_EVERY 帧擦 FADE × FADE_EVERY，总量和原来一样，但残影能消干净
    if (frameCount % C.FADE_EVERY === 0) {
      this.pg.erase(Math.min(255, C.FADE * C.FADE_EVERY));
      this.pg.noStroke();
      this.pg.rect(0, 0, this.areaW, this.areaH);
      this.pg.noErase();
    }
    for (const d of this.dots) {
      d.update();
      d.draw(this.pg);
    }
  }

  brightnessAt(x, y) {
    const ix = Math.floor(constrain(x, 0, this.guide.width - 1));
    const iy = Math.floor(constrain(y, 0, this.guide.height - 1));
    const idx = 4 * (iy * this.guide.width + ix);
    const p = this.guide.pixels;
    const bri = (p[idx] + p[idx + 1] + p[idx + 2]) / 3;
    return (255 - bri) * (p[idx + 3] / 255);
  }

  gradientAt(x, y) {
    const d = 2;
    const gx = this.brightnessAt(x + d, y) - this.brightnessAt(x - d, y);
    const gy = this.brightnessAt(x, y + d) - this.brightnessAt(x, y - d);
    return createVector(gx, gy);
  }

  fogDensityAt(x, y) {
    const C = P1_CLOUD;
    const n = noise(x * C.FOG_SCALE + 1000, y * C.FOG_SCALE + 1000, frameCount * C.FOG_SPEED);
    const t = constrain((n - C.FOG_LOW) / (C.FOG_HIGH - C.FOG_LOW), 0, 1);
    return t * t * (3 - 2 * t);
  }
}


// ---------------------------------------------------------- 原版 CloudDot
class P1CloudDot {
  constructor(parent) {
    this.parent = parent;
    this.spawn();
  }

  spawn() {
    const p = this.parent, C = P1_CLOUD;
    let x, y;
    for (let tries = 0; tries < 100; tries++) {
      x = random(p.guide.width);
      y = random(p.guide.height);
      if (p.brightnessAt(x, y) > C.THRESHOLD) break;
    }
    this.pos = createVector(x, y);
    this.prev = this.pos.copy();

    const g = p.gradientAt(x, y);
    this.vel = createVector(-g.y, g.x);
    if (this.vel.mag() < 0.001) this.vel = p5.Vector.random2D();
    if (random() < 0.5) this.vel.mult(-1);
    this.vel.setMag(C.SPEED);

    this.grace = C.GRACE;
    this.col = random(C.PALETTE);
    this.life = random(C.LIFE * 0.5, C.LIFE);
    this.maxLife = this.life;
  }

  update() {
    const p = this.parent, C = P1_CLOUD;
    const g = p.gradientAt(this.pos.x, this.pos.y);

    const tangent = createVector(-g.y, g.x);
    if (tangent.dot(this.vel) < 0) tangent.mult(-1);

    if (tangent.mag() > 0.001) {
      tangent.setMag(C.SPEED);
      const pull = g.copy().limit(C.SPEED * 2).mult(C.PULL);
      this.vel.add(p5.Vector.sub(tangent, this.vel).mult(0.2));
      this.vel.add(pull);
      this.vel.setMag(C.SPEED);
    }

    const n = noise(this.pos.x * C.NOISE_SCALE, this.pos.y * C.NOISE_SCALE,
                    frameCount * C.NOISE_SPEED);
    this.vel.rotate(map(n, 0, 1, -C.NOISE_TURN, C.NOISE_TURN));

    this.prev = this.pos.copy();
    this.pos.add(this.vel);
    this.life--;

    if (p.brightnessAt(this.pos.x, this.pos.y) < C.THRESHOLD * 0.4) this.grace--;
    else this.grace = C.GRACE;

    if (this.life <= 0 || this.grace <= 0 ||
        this.pos.x < 0 || this.pos.x >= p.guide.width ||
        this.pos.y < 0 || this.pos.y >= p.guide.height) {
      this.spawn();
    }
  }

  draw(pg) {
    const C = P1_CLOUD;
    const fog = this.parent.fogDensityAt(this.pos.x, this.pos.y);
    if (fog <= 0.01) return;
    const am = this.col[3] ?? 1;   // [淡化白纹] 透明度倍数
    const wm = this.col[4] ?? 1;   // [淡化白纹] 粗细倍数
    const w = map(this.life, 0, this.maxLife, 0.3, C.WEIGHT) * wm;
    pg.stroke(this.col[0], this.col[1], this.col[2], C.ALPHA * fog * am);
    pg.strokeWeight(w);
    pg.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}


// ==========================================================
//  [框架接入] 替换 sketch.js 里的两个空函数
// ==========================================================
let p1 = null;
let p1LastFrame = -1;

function p1System() {
  if (!p1) {
    p1 = new Part1(null);
    loadImage(
      P1_CLOUD.GUIDE_SRC,
      (img) => p1.setCloudImage(img),
      () => console.error('[Part1] 找不到 cloud.png，检查文件名和路径')
    );
  }
  return p1;
}

function p1Tick(idleState) {
  if (p1LastFrame === frameCount) return;
  p1LastFrame = frameCount;
  p1System().update(idleState);
}

// 【图层 2】bg1 之上、bg2 之下
function drawKristenClouds(idleState) {
  p1Tick(idleState);
  p1System().displayCloud();
}

// 【图层 7】日月光效之上、提灯之下
function drawKristenFog(idleState, mx, my) {
  p1Tick(idleState);
  p1System().displayFog();
}