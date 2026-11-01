// =============================================================
//  perlin-noise.js · Kristen · 天界祥云层 (Part1)
//  ① 月白浓雾：全屏 Perlin 噪声雾，鼠标移动 → 慢慢散开；isIdle → 合拢
//  ② 云纹：原版 CloudDot 效果（铺满全屏），在雾下持续生成，雾散开后露出
//  只读全局 isIdle（Haocheng 提供）；没有时用内置 10 秒计时，仅供单独测试
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
  OFFSET_Y: 0,            // 从画面顶部开始
  HEAVEN_RATIO: 1,        // 1 = 铺满整个画布高度

  SPEED: 1.0,
  FADE: 2,
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

  // 云纹自身的显隐（原版的浓度场，让云纹一块块浮现/隐去）
  FOG_SCALE: 0.004,
  FOG_SPEED: 0.002,
  FOG_LOW: 0.35,
  FOG_HIGH: 0.65,

  PALETTE: [
    [196, 160, 98],   // 鎏金
    [230, 200, 140],  // 亮金
    [235, 230, 220],  // 月白
  ],
};

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
//  以下是功能代码，一般不需要改
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★


class Part1 {
  constructor(cloudImg, options = {}) {
    this.cfg = Object.assign({}, P1_FOG, options);

    this.cloudImg = cloudImg;
    this.revealMax = 1 + this.cfg.EDGE;
    this.reveal = 0;        // 实际显示的散开进度
    this.revealTarget = 0;  // 鼠标累计出来的目标进度（reveal 慢慢追上它）
    this.ox = width / 2;
    this.oy = height / 2;
    this.lastActive = -Infinity;
    this.fullyClosed = true;

    this._buildFogGrid();
    this._buildCloud();
  }

  // 画布尺寸变化时重建（sketch.js 的 windowResized 会调用）
  resize() {
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
  update() {
    const c = this.cfg;
    const inside = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
    const mv = inside ? Math.min(60, dist(mouseX, mouseY, pmouseX, pmouseY)) : 0;
    if (mv > 0.5 || mouseIsPressed) this.lastActive = millis();

    const idle = this._readIdle();

    if (!idle) {
      if (mv > 0.5) {
        this.revealTarget = Math.min(this.revealMax, this.revealTarget + mv * c.REVEAL_PER_PX);
        this.ox = mouseX;
        this.oy = mouseY;
      }
      // 限速：再快地甩鼠标，雾也只按 REVEAL_SPEED 慢慢化开
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

    this._updateCloud();
    if (frameCount % c.FOG_EVERY === 0 || frameCount < 3) this._renderFog();
  }

  display() {
    const c = this.cfg;
    image(this.pg, 0, this.areaY);                     // 云纹在下
    image(this.fogG, -c.CELL / 2, -c.CELL / 2,
          this.cols * c.CELL, this.rows * c.CELL);     // 浓雾在上
  }

  _readIdle() {
    if (typeof isIdle !== 'undefined') return !!isIdle;   // Haocheng 的全局变量
    return millis() - this.lastActive > this.cfg.IDLE_MS; // 备用：单独测试用
  }

  // ========================================================== ① 浓雾
  _buildFogGrid() {
    const c = this.cfg;
    this.cols = Math.ceil(width / c.CELL) + 1;
    this.rows = Math.ceil(height / c.CELL) + 1;
    const n = this.cols * this.rows;
    this.mask = new Float32Array(n);
    this.grain = new Float32Array(n);  // 静态噪声：决定散开边缘的撕裂形状
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

  // open=true 只增不减（路径保留）；open=false 只减不增（回雾）
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
        // 幂次曲线：一开始散就迅速变透明，不在黑底上留灰纱
        const a = c.FOG_ALPHA * Math.pow(1 - s, c.FADE_POWER);
        if (a < 1) { px[idx + 3] = 0; continue; }

        const x = i * c.FOG_SCALE, y = j * c.FOG_SCALE * 1.6;  // 横向拉长 → 云团感
        const w = noise(x * 0.5 + t, y * 0.5 - t * 0.5, 7.3);   // domain warp
        let v = noise(x + w * 2 - t * 0.6, y + w * 1.2, t) * 0.65 +
                noise(x * 2.3 + 40, y * 2.3, t * 1.5) * 0.35;
        v = constrain((v - 0.25) / 0.5, 0, 1);
        v = constrain(0.5 + (v - 0.5) * c.FOG_CONTRAST, 0, 1); // 加强云团层次

        const rim = 4 * m * (1 - m);               // 只在撕开边缘 ≈ 1
        const lum = c.FOG_DARK + (c.FOG_LIGHT - c.FOG_DARK) * v + rim * c.RIM_LIGHT;

        let r = lum * tr, gch = lum * tg, b = lum * tb;
        const gm = rim * c.RIM_GOLD_MIX;           // 边缘向淡金过渡
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

    this.dots = [];
    for (let i = 0; i < C.COUNT; i++) this.dots.push(new P1CloudDot(this));
  }

  _updateCloud() {
    this.pg.erase(P1_CLOUD.FADE);
    this.pg.noStroke();
    this.pg.rect(0, 0, this.areaW, this.areaH);
    this.pg.noErase();
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

  // 返回梯度向量（指向墨线中心），切线由粒子自己算
  gradientAt(x, y) {
    const d = 2;
    const gx = this.brightnessAt(x + d, y) - this.brightnessAt(x - d, y);
    const gy = this.brightnessAt(x, y + d) - this.brightnessAt(x, y - d);
    return createVector(gx, gy);
  }

  // 云纹显隐浓度：0（全隐）~ 1（全显）
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

    // 切线方向（沿线走），选和当前方向同侧，避免抽搐
    const tangent = createVector(-g.y, g.x);
    if (tangent.dot(this.vel) < 0) tangent.mult(-1);

    if (tangent.mag() > 0.001) {
      tangent.setMag(C.SPEED);
      const pull = g.copy().limit(C.SPEED * 2).mult(C.PULL);
      this.vel.add(p5.Vector.sub(tangent, this.vel).mult(0.2)); // 缓慢转向切线
      this.vel.add(pull);                                        // 吸附回线
      this.vel.setMag(C.SPEED);
    }

    // Perlin noise 自然摆动
    const n = noise(this.pos.x * C.NOISE_SCALE, this.pos.y * C.NOISE_SCALE,
                    frameCount * C.NOISE_SPEED);
    this.vel.rotate(map(n, 0, 1, -C.NOISE_TURN, C.NOISE_TURN));

    this.prev = this.pos.copy();
    this.pos.add(this.vel);
    this.life--;

    // 离线判定：走丢很快重生
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
    if (fog <= 0.01) return; // 浓度太低 → 不画，粒子照常运动
    const w = map(this.life, 0, this.maxLife, 0.3, C.WEIGHT);
    pg.stroke(this.col[0], this.col[1], this.col[2], C.ALPHA * fog);
    pg.strokeWeight(w);
    pg.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}