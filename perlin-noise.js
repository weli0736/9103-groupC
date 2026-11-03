// ==========================================
// IDEA9103 - Awakening Heaven
// Part 1: Heavenly Fog & Xiangyun Clouds (Kristen)
// Hooks into sketch.js: drawKristenClouds(), drawKristenFog()
// Reads from main framework: isIdle (Haocheng), width, height, mouseX, mouseY
// Load this file AFTER sketch.js so these functions replace the empty placeholders.
// ==========================================

// ---------- Config: all tuning values live here ----------
const P1_FOG = {
  CELL: 8,                  // fog grid size in px. Bigger = faster, softer
  NOISE_SCALE: 0.0025,      // noise zoom, per px
  WARP: 3.0,                // domain warp strength
  DRIFT: 0.00005,           // fog drift speed, per ms
  LIGHT: [238, 230, 214],   // warm moon-white (thick parts)
  SHADOW: [190, 178, 160],  // thinner parts, a little darker
  ALPHA_MAX: 235,           // 0-255, opacity of the thickest fog
  ALPHA_MIN: 0.6,           // thinnest fog = ALPHA_MAX * this
  BREATH: 0.05,             // slow breathing while idle
  BRUSH: 0.09,              // reveal radius, ratio of canvas width
  TEAR: 0.45,               // ragged edge amount, 0-1
  REVEAL_SPEED: 0.03,       // max mask increase per frame (at 60fps)
  CLOSE_SECONDS: 4          // time for the fog to close once isIdle is true
};

const P1_CLOUD = {
  GUIDE_SRC: 'xiangyun.png',                    // dark lines on light or transparent bg
  AREA: { x: 0.25, y: 0.02, w: 0.5, h: 0.4 },   // where the pattern sits (ratio of canvas)
  COUNT: 260,
  SPEED: 1.2,
  PULL: 0.6,                // pulls dots back onto the dark line
  WOBBLE: 0.35,             // Perlin wobble
  LINE_LIMIT: 0.55,         // brightness above this = off the line -> respawn
  LIFE_MIN: 90,
  LIFE_MAX: 220,
  COLOR: [222, 178, 92],    // gold
  WEIGHT: 1.4,
  ALPHA: 160,
  IDLE_VIS: 0.3,            // cloud strength while idle
  FADE: 10,                 // trail erase strength per frame
  DRAW_IN_FOG_PASS: true    // true = draw just under the fog (needed while 1111.png is opaque)
};

// ---------- Helper ----------
function p1Smooth(e0, e1, x) {
  const t = constrain((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

// ==========================================
// Part1: fog + reveal mask + cloud buffer
// ==========================================
class Part1 {
  constructor() {
    this.w = 0;
    this.h = 0;
    this.fogG = null;
    this.pg = null;
    this.guide = null;
    this.cloudVis = P1_CLOUD.IDLE_VIS;
    this.dots = [];

    // No preload() here (sketch.js owns it), so the guide image loads with a callback.
    loadImage(
      P1_CLOUD.GUIDE_SRC,
      (img) => {
        img.loadPixels();
        this.guide = img;
        this._fitGuide();
        this._resetDots();
      },
      () => console.warn('[Part1] guide image not found, using a plain flow field')
    );

    this._rebuild();
    this._resetDots();
  }

  // Called again whenever the canvas size changes (windowResized in sketch.js)
  _rebuild() {
    this.w = width;
    this.h = height;
    this._buildFogGrid();
    if (this.pg) this.pg.remove();
    this.pg = createGraphics(width, height);
    this._fitGuide();
  }

  // [AI] Low-res fog grid. One cell = CELL px. Fog is drawn on a tiny buffer, then scaled up.
  _buildFogGrid() {
    const c = P1_FOG.CELL;
    this.cols = Math.ceil(width / c) + 1;
    this.rows = Math.ceil(height / c) + 1;

    if (this.fogG) this.fogG.remove();
    this.fogG = createGraphics(this.cols, this.rows);
    this.fogG.pixelDensity(1);

    const n = this.cols * this.rows;
    this.mask = new Float32Array(n); // 0 = fog, 1 = clear
    this.tear = new Float32Array(n); // fixed noise, for torn edges
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        this.tear[j * this.cols + i] = noise(i * 0.35 + 300, j * 0.35 + 300);
      }
    }
  }

  // Fit the guide image inside AREA, keep its proportions
  _fitGuide() {
    if (!this.guide) return;
    const a = P1_CLOUD.AREA;
    const aw = a.w * width;
    const ah = a.h * height;
    this.gs = Math.min(aw / this.guide.width, ah / this.guide.height);
    this.gx0 = a.x * width + (aw - this.guide.width * this.gs) / 2;
    this.gy0 = a.y * height + (ah - this.guide.height * this.gs) / 2;
  }

  _resetDots() {
    this.dots = [];
    for (let i = 0; i < P1_CLOUD.COUNT; i++) this.dots.push(new P1CloudDot(this));
  }

  // ---------- Per frame ----------
  update(idle, mx, my) {
    if (width !== this.w || height !== this.h) {
      this._rebuild();
      this._resetDots();
    }
    const dt = Math.min(deltaTime, 50) / 1000;
    this._applyMask(idle, mx, my, dt);
    this.cloudVis = lerp(this.cloudVis, idle ? P1_CLOUD.IDLE_VIS : 1, 0.03);
    this._updateCloud();
  }

  // [AI] Reveal mask. Each cell opens a little per frame, never faster than REVEAL_SPEED.
  _applyMask(idle, mx, my, dt) {
    const F = P1_FOG;
    const m = this.mask;
    const c = F.CELL;

    // Idle: everything closes back over CLOSE_SECONDS
    if (idle) {
      const close = dt / F.CLOSE_SECONDS;
      for (let k = 0; k < m.length; k++) {
        if (m[k] > 0) m[k] = Math.max(0, m[k] - close);
      }
      return;
    }

    if (mx < 0 || my < 0 || mx > width || my > height) return;

    const R = F.BRUSH * width;
    const reach = R * (1 + F.TEAR);
    const step = F.REVEAL_SPEED * dt * 60;

    const i0 = Math.max(0, Math.floor((mx - reach) / c));
    const i1 = Math.min(this.cols - 1, Math.ceil((mx + reach) / c));
    const j0 = Math.max(0, Math.floor((my - reach) / c));
    const j1 = Math.min(this.rows - 1, Math.ceil((my + reach) / c));

    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const k = j * this.cols + i;
        const d = Math.hypot((i + 0.5) * c - mx, (j + 0.5) * c - my);
        const torn = d + (this.tear[k] - 0.5) * 2 * F.TEAR * R; // distance + fixed noise
        const target = 1 - p1Smooth(R * 0.35, R, torn);
        if (target > m[k]) m[k] = Math.min(target, m[k] + step);
      }
    }
  }

  _updateCloud() {
    const pg = this.pg;
    const C = P1_CLOUD;

    // Old strokes fade a little each frame -> brush-like trail
    pg.push();
    pg.noStroke();
    pg.erase(C.FADE, 0);
    pg.rect(0, 0, pg.width, pg.height);
    pg.noErase();
    pg.pop();

    pg.strokeWeight(C.WEIGHT);
    for (const d of this.dots) d.step(this, pg);
  }

  // [AI] Domain-warped noise: one noise layer bends the coordinates of another.
  _renderFog(idle) {
    const F = P1_FOG;
    const g = this.fogG;
    const t = millis() * F.DRIFT;
    const s = F.NOISE_SCALE * F.CELL;
    const breath = idle ? 1 + F.BREATH * Math.sin(millis() * 0.0012) : 1;

    g.loadPixels();
    const p = g.pixels;

    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const k = j * this.cols + i;
        const o = k * 4;
        const open = this.mask[k];

        if (open >= 0.999) {
          p[o + 3] = 0;
          continue;
        }

        const x = i * s;
        const y = j * s;
        const qx = noise(x + t, y);
        const qy = noise(x + 5.2, y + 1.3 - t);
        const r = noise(x + F.WARP * qx + 1.7, y + F.WARP * qy + 9.2 + t * 0.5);
        const d = p1Smooth(0.3, 0.7, r);

        const a = F.ALPHA_MAX * (F.ALPHA_MIN + (1 - F.ALPHA_MIN) * d) * breath * (1 - open);
        p[o]     = F.SHADOW[0] + (F.LIGHT[0] - F.SHADOW[0]) * d;
        p[o + 1] = F.SHADOW[1] + (F.LIGHT[1] - F.SHADOW[1]) * d;
        p[o + 2] = F.SHADOW[2] + (F.LIGHT[2] - F.SHADOW[2]) * d;
        p[o + 3] = Math.min(255, a);
      }
    }
    g.updatePixels();
  }

  // ---------- Guide image reading ----------
  // Brightness at guide pixel coords: 0 = dark line, 1 = empty
  _bright(gx, gy) {
    const g = this.guide;
    gx = constrain(gx | 0, 0, g.width - 1);
    gy = constrain(gy | 0, 0, g.height - 1);
    const k = (gy * g.width + gx) * 4;
    const px = g.pixels;
    const lum = (px[k] + px[k + 1] + px[k + 2]) / 765;
    return 1 - (1 - lum) * (px[k + 3] / 255); // transparent counts as empty
  }

  // [AI] Brightness + gradient at a canvas point. Returns null outside the guide image.
  gradientAt(x, y) {
    if (!this.guide) return null;
    const gx = (x - this.gx0) / this.gs;
    const gy = (y - this.gy0) / this.gs;
    if (gx < 2 || gy < 2 || gx >= this.guide.width - 2 || gy >= this.guide.height - 2) return null;
    const s = 2;
    return {
      b: this._bright(gx, gy),
      dx: (this._bright(gx + s, gy) - this._bright(gx - s, gy)) / (2 * s),
      dy: (this._bright(gx, gy + s) - this._bright(gx, gy - s)) / (2 * s)
    };
  }

  // ---------- Drawing to the main canvas ----------
  drawClouds() {
    push();
    blendMode(BLEND);
    image(this.pg, 0, 0, width, height);
    pop();
  }

  drawFog(idle) {
    this._renderFog(idle);
    push();
    blendMode(BLEND);
    const c = P1_FOG.CELL;
    image(this.fogG, 0, 0, this.cols * c, this.rows * c);
    pop();
  }
}

// ==========================================
// P1CloudDot: one gold particle
// ==========================================
// Particles follow the dark lines of the xiangyun image by reading its brightness gradient.
// [REF] Flow-field particle idea from The Coding Train: https://www.youtube.com/watch?v=BjoM9oKOAKY
class P1CloudDot {
  constructor(sys) {
    this.respawn(sys);
  }

  respawn(sys) {
    const a = P1_CLOUD.AREA;
    // Try a few random spots, keep one that sits on a dark line
    for (let tries = 0; tries < 30; tries++) {
      this.x = (a.x + random(a.w)) * width;
      this.y = (a.y + random(a.h)) * height;
      if (!sys.guide) break;
      const g = sys.gradientAt(this.x, this.y);
      if (g && g.b < P1_CLOUD.LINE_LIMIT * 0.8) break;
    }
    const ang = random(TWO_PI);
    this.vx = Math.cos(ang);
    this.vy = Math.sin(ang);
    this.px = this.x;
    this.py = this.y;
    this.maxLife = random(P1_CLOUD.LIFE_MIN, P1_CLOUD.LIFE_MAX);
    this.life = this.maxLife;
  }

  step(sys, pg) {
    const C = P1_CLOUD;
    const a = C.AREA;
    this.px = this.x;
    this.py = this.y;

    const n = noise(this.x * 0.008, this.y * 0.008, millis() * 0.0002) * TWO_PI * 2;
    let ax = Math.cos(n) * C.WOBBLE;
    let ay = Math.sin(n) * C.WOBBLE;

    if (sys.guide) {
      const g = sys.gradientAt(this.x, this.y);
      if (!g || g.b > C.LINE_LIMIT) {
        this.respawn(sys);
        return;
      }
      const len = Math.hypot(g.dx, g.dy);
      if (len > 1e-4) {
        let tx = -g.dy / len; // along the line (perpendicular to the gradient)
        let ty = g.dx / len;
        if (tx * this.vx + ty * this.vy < 0) { tx = -tx; ty = -ty; } // keep the same direction
        ax += tx * C.SPEED - (g.dx / len) * C.PULL; // move along + pull toward darker
        ay += ty * C.SPEED - (g.dy / len) * C.PULL;
      } else {
        ax += this.vx * C.SPEED;
        ay += this.vy * C.SPEED;
      }
    } else {
      // Fallback when the image is missing: plain Perlin flow field
      ax += Math.cos(n) * C.SPEED;
      ay += Math.sin(n) * C.SPEED;
    }

    this.vx = lerp(this.vx, ax, 0.25);
    this.vy = lerp(this.vy, ay, 0.25);
    this.x += this.vx;
    this.y += this.vy;

    const out = this.x < a.x * width || this.x > (a.x + a.w) * width ||
                this.y < a.y * height || this.y > (a.y + a.h) * height;
    if (--this.life <= 0 || out) {
      this.respawn(sys);
      return;
    }

    const fade = Math.sin(Math.PI * this.life / this.maxLife);
    pg.stroke(C.COLOR[0], C.COLOR[1], C.COLOR[2], C.ALPHA * fade * sys.cloudVis);
    pg.line(this.px, this.py, this.x, this.y);
  }
}

// ==========================================
// Framework hooks (replace the placeholders in sketch.js)
// ==========================================
let p1 = null;
function p1System() {
  if (!p1) p1 = new Part1(); // first frame: canvas already exists
  return p1;
}

// Layer 1 in sketch.js (under 1111.png)
function drawKristenClouds(idleState) {
  const s = p1System();
  s.update(idleState, mouseX, mouseY);
  if (!P1_CLOUD.DRAW_IN_FOG_PASS) s.drawClouds();
}

// Layer 5 in sketch.js (above everything except Junyu's lantern)
function drawKristenFog(idleState, mx, my) {
  const s = p1System();
  if (P1_CLOUD.DRAW_IN_FOG_PASS) s.drawClouds();
  s.drawFog(idleState);
}