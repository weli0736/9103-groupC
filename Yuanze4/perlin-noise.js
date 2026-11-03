// =============================================================
//  perlin-noise.js · Kristen · 天界祥云层 (Part1)
//  ① 雾底：全屏灰白 Perlin 噪声雾（低分辨率计算，放大显示）
//  ② 散开蒙版：鼠标移动 → 从提灯处向全屏撕开；isIdle → 慢慢合拢
//  ③ 云纹：沿 cloud.png 墨线流动的粒子，只在散开处可见
//  只读全局 isIdle（Haocheng 提供）；没有时自动用内置 10 秒计时，仅供单独测试
// =============================================================
class Part1 {
  constructor(cloudImg, options = {}) {
    this.cfg = Object.assign({
      // —— 雾底 ——
      CELL: 8,            // 雾网格像素，越大越省性能、越柔
      FOG_EVERY: 2,       // 每几帧重算一次雾纹理
      FOG_ALPHA: 250,     // 浓雾不透明度（250 ≈ 完全看不见底图）
      FOG_DARK: 118,      // 雾最暗处灰度
      FOG_LIGHT: 196,     // 雾最亮处灰度
      FOG_SCALE: 0.045,   // 雾团大小（越小越大团）
      FOG_SPEED: 0.0035,  // 雾流动速度
      RIM_LIGHT: 38,      // 撕开边缘的提亮
      // —— 散开 / 合拢 ——
      REVEAL_PER_PX: 0.0011, // 鼠标每移动 1px 增加的散开进度
      EDGE: 0.16,            // 散开边缘的柔和宽度
      DIST_WEIGHT: 0.55,     // 0 = 随机斑块散开；1 = 纯圆形从提灯向外扩
      CLOSE_SECONDS: 5,      // isIdle 后多少秒盖满
      IDLE_MS: 10000,        // 仅备用计时使用
      // —— 云纹粒子 ——
      INK_CELL: 4,
      INK_MIN: 0.08,      // 低于此值视为离开墨线 → 重生
      SPAWN_INK: 0.35,    // 只在墨线浓处出生
      PARTICLES: 1200,
      SPEED: 1.1,
      PULL: 9,            // 向墨线中心的拉力
      WOBBLE: 0.9,        // Perlin 摆动幅度（弧度）
      PUSH_R: 130,        // 鼠标推开半径
      PUSH_F: 2.2,
      LINE_ALPHA: 70,
      LINE_W: 1.1,
      TRAIL_FADE: 7,      // 拖尾擦除速度
      TRAIL_FADE_IDLE: 22,
      COLORS: [           // 月白为主，少量淡金
        [236, 231, 216], [236, 231, 216], [236, 231, 216], [214, 186, 122]
      ],
    }, options);

    this.revealMax = 1 + this.cfg.EDGE;
    this.reveal = 0;
    this.ox = width / 2;
    this.oy = height / 2;
    this.lastActive = -Infinity;
    this.fullyClosed = true;

    this.cloudImg = cloudImg;
    this._buildFogGrid();
    this._buildInk(cloudImg);

    this.trailG = createGraphics(width, height);
    this.trailG.pixelDensity(1);

    this.particles = [];
    for (let i = 0; i < this.cfg.PARTICLES; i++) {
      const p = {};
      this._spawn(p);
      p.life = random(p.life);
      this.particles.push(p);
    }
  }

  // 画布尺寸变化时重建像素网格，释放旧的离屏画布。
  resize() {
    this.fogG.remove();
    this.trailG.remove();
    this.ox = width / 2;
    this.oy = height / 2;
    this.reveal = 0;
    this.fullyClosed = true;
    this._buildFogGrid();
    this._buildInk(this.cloudImg);
    this.trailG = createGraphics(width, height);
    this.trailG.pixelDensity(1);
    for (const p of this.particles) this._spawn(p);
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
        this.reveal = Math.min(this.revealMax, this.reveal + mv * c.REVEAL_PER_PX);
        this.ox = mouseX;
        this.oy = mouseY;
      }
      this._applyMask(true);
      this.fullyClosed = false;
    } else if (!this.fullyClosed) {
      this.reveal = Math.max(0, this.reveal - this.revealMax / (c.CLOSE_SECONDS * 60));
      this._applyMask(false);
      if (this.reveal === 0) {
        this.mask.fill(0);
        this.trailG.clear();
        this.fullyClosed = true;
      }
    }

    this._updateParticles(idle, inside);
    if (frameCount % c.FOG_EVERY === 0 || frameCount < 3) this._renderFog();
  }

  display() {
    const c = this.cfg;
    image(this.trailG, 0, 0);               // 云纹在雾下
    image(this.fogG, -c.CELL / 2, -c.CELL / 2,
          this.cols * c.CELL, this.rows * c.CELL); // 雾在最上
  }

  // ---------------------------------------------------------- 状态
  _readIdle() {
    if (typeof isIdle !== 'undefined') return !!isIdle;   // Haocheng 的全局变量
    return millis() - this.lastActive > this.cfg.IDLE_MS; // 备用：单独测试用
  }

  // ---------------------------------------------------------- ② 蒙版
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

  _maskAt(x, y) {
    const c = this.cfg;
    const i = constrain(Math.round(x / c.CELL), 0, this.cols - 1);
    const j = constrain(Math.round(y / c.CELL), 0, this.rows - 1);
    return this.mask[j * this.cols + i];
  }

  // ---------------------------------------------------------- ① 雾底
  _renderFog() {
    const c = this.cfg, g = this.fogG, cols = this.cols;
    const t = frameCount * c.FOG_SPEED;
    g.loadPixels();
    const px = g.pixels;
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i, idx = k * 4;
        const m = this.mask[k];
        const s = m * m * (3 - 2 * m);
        const a = c.FOG_ALPHA * (1 - s);
        if (a < 1) { px[idx + 3] = 0; continue; }

        const x = i * c.FOG_SCALE, y = j * c.FOG_SCALE * 1.6; // 横向拉长 → 云团感
        const w = noise(x * 0.5 + t, y * 0.5 - t * 0.5, 7.3);  // domain warp
        let v = noise(x + w * 2 - t * 0.6, y + w * 1.2, t) * 0.65 +
                noise(x * 2.3 + 40, y * 2.3, t * 1.5) * 0.35;
        v = constrain((v - 0.25) / 0.5, 0, 1);

        const lum = c.FOG_DARK + (c.FOG_LIGHT - c.FOG_DARK) * v +
                    4 * m * (1 - m) * c.RIM_LIGHT;
        px[idx]     = lum - 3;
        px[idx + 1] = lum;
        px[idx + 2] = lum + 5;   // 极轻的冷调
        px[idx + 3] = a;
      }
    }
    g.updatePixels();
  }

  // ---------------------------------------------------------- ③ 云纹
  _buildInk(img) {
    const c = this.cfg, s = c.INK_CELL;
    const iw = this.iw = Math.ceil(width / s);
    const ih = this.ih = Math.ceil(height / s);
    const g = createGraphics(iw, ih);
    g.pixelDensity(1);
    g.image(img, 0, 0, iw, ih);
    g.loadPixels();

    let ink = new Float32Array(iw * ih);
    const alpha = new Float32Array(iw * ih);
    let maxInk = 0;
    for (let k = 0; k < iw * ih; k++) {
      const r = g.pixels[k * 4], gg = g.pixels[k * 4 + 1],
            b = g.pixels[k * 4 + 2], a = g.pixels[k * 4 + 3] / 255;
      const lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
      ink[k] = a * (1 - lum);
      alpha[k] = a;
      if (ink[k] > maxInk) maxInk = ink[k];
    }
    if (maxInk < 0.15) ink = alpha;  // 浅色线条 + 透明底的 png 改用 alpha
    g.remove();

    ink = this._blur(this._blur(ink, iw, ih), iw, ih);
    let mx = 0;
    for (const v of ink) if (v > mx) mx = v;
    if (mx > 0) for (let k = 0; k < ink.length; k++) ink[k] /= mx;
    this.ink = ink;

    this.gx = new Float32Array(iw * ih);
    this.gy = new Float32Array(iw * ih);
    this.inkCells = [];
    for (let j = 0; j < ih; j++) {
      for (let i = 0; i < iw; i++) {
        const k = j * iw + i;
        const l = ink[j * iw + Math.max(0, i - 1)], r = ink[j * iw + Math.min(iw - 1, i + 1)];
        const u = ink[Math.max(0, j - 1) * iw + i], d = ink[Math.min(ih - 1, j + 1) * iw + i];
        this.gx[k] = (r - l) * 0.5;
        this.gy[k] = (d - u) * 0.5;
        if (ink[k] > c.SPAWN_INK) this.inkCells.push(k);
      }
    }
  }

  _blur(a, w, h) {
    const o = new Float32Array(a.length);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let sum = 0, n = 0;
      for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
        const ii = i + x, jj = j + y;
        if (ii >= 0 && ii < w && jj >= 0 && jj < h) { sum += a[jj * w + ii]; n++; }
      }
      o[j * w + i] = sum / n;
    }
    return o;
  }

  _inkIndex(x, y) {
    const s = this.cfg.INK_CELL;
    const i = constrain(Math.floor(x / s), 0, this.iw - 1);
    const j = constrain(Math.floor(y / s), 0, this.ih - 1);
    return j * this.iw + i;
  }

  _spawn(p) {
    const c = this.cfg, s = c.INK_CELL;
    if (this.inkCells.length) {
      const k = this.inkCells[Math.floor(random(this.inkCells.length))];
      p.x = (k % this.iw + random()) * s;
      p.y = (Math.floor(k / this.iw) + random()) * s;
    } else {
      p.x = random(width); p.y = random(height);
    }
    p.px = p.x; p.py = p.y;
    const a = random(TWO_PI);
    p.vx = Math.cos(a) * 0.3; p.vy = Math.sin(a) * 0.3;
    p.life = random(120, 420);
    const col = random(c.COLORS);
    p.r = col[0]; p.g = col[1]; p.b = col[2];
  }

  _updateParticles(idle, inside) {
    const c = this.cfg, g = this.trailG;
    const t = frameCount * 0.004, R2 = c.PUSH_R * c.PUSH_R;

    g.erase(idle ? c.TRAIL_FADE_IDLE : c.TRAIL_FADE, 0);
    g.noStroke();
    g.rect(0, 0, width, height);
    g.noErase();
    g.strokeWeight(c.LINE_W);

    for (const p of this.particles) {
      const k = this._inkIndex(p.x, p.y);
      const gx = this.gx[k], gy = this.gy[k];

      // 切线方向（沿墨线），与当前速度同向，避免来回抖
      let tx = -gy, ty = gx;
      let tl = Math.hypot(tx, ty);
      if (tl < 1e-5) { tx = p.vx; ty = p.vy; tl = Math.hypot(tx, ty) || 1; }
      tx /= tl; ty /= tl;
      if (tx * p.vx + ty * p.vy < 0) { tx = -tx; ty = -ty; }

      // Perlin 摆动
      const a = (noise(p.x * 0.004, p.y * 0.004, t) - 0.5) * c.WOBBLE;
      const ca = Math.cos(a), sa = Math.sin(a);
      let dx = (tx * ca - ty * sa) * c.SPEED + gx * c.PULL;
      let dy = (tx * sa + ty * ca) * c.SPEED + gy * c.PULL;

      // 被提灯轻轻推开
      if (inside) {
        const mx = p.x - mouseX, my = p.y - mouseY, d2 = mx * mx + my * my;
        if (d2 < R2 && d2 > 1) {
          const d = Math.sqrt(d2), f = (1 - d / c.PUSH_R) * c.PUSH_F;
          dx += (mx / d) * f; dy += (my / d) * f;
        }
      }

      p.vx = p.vx * 0.8 + dx * 0.2;
      p.vy = p.vy * 0.8 + dy * 0.2;
      p.px = p.x; p.py = p.y;
      p.x += p.vx; p.y += p.vy;
      p.life--;

      // 只在散开处画：浓雾下粒子照常流动但不留痕
      const m = this._maskAt(p.x, p.y);
      if (m > 0.02) {
        g.stroke(p.r, p.g, p.b, c.LINE_ALPHA * m);
        g.line(p.px, p.py, p.x, p.y);
      }

      if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height ||
          this.ink[this._inkIndex(p.x, p.y)] < c.INK_MIN) {
        this._spawn(p);
      }
    }
  }
}
