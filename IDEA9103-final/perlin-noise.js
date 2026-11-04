// =============================================================
//  perlin-noise.js · Kristen · Heavenly Cloud Layer (Part1)
//  ① Moon-white fog: full-screen Perlin noise fog.
//     Mouse movement → fog slowly clears. isIdle → fog closes again.
//  ② Cloud pattern: original CloudDot effect (full screen),
//     generated from cloud.png. Shows up once the fog clears.
//  Framework hookup (Haocheng):
//    drawKristenClouds() → Layer 2 (above bg1, below bg2)
//    drawKristenFog()    → Layer 7 (above sun/moon glow, below lantern)
//  In index.html, this file MUST load after sketch.js.
// =============================================================


// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
//  SETTINGS — you normally only need to edit this section
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

// ===== ① Fog settings =====
const P1_FOG = {
  // --- Fog color ---
  FOG_ALPHA: 245,                 // Fog opacity (255 = fully covers; 225 lets some background through)
  FOG_DARK: 186,                  // Brightness of dark areas (higher = whiter)
  FOG_LIGHT: 250,                 // Brightness of light areas
  FOG_CONTRAST: 1.25,             // Cloud contrast (1 = original, higher = more depth)
  FOG_TINT: [1.0, 0.985, 0.945],  // R/G/B multipliers: slightly less blue → warm white
                                  //   Warmer beige-gold: [1.0, 0.97, 0.9]
                                  //   Cool moonlight:    [0.97, 0.985, 1.0]
  RIM_LIGHT: 26,                  // Extra brightness on the opening edge
  RIM_GOLD: [232, 204, 150],      // Soft gold color on the opening edge
  RIM_GOLD_MIX: 0.45,             // Gold mix amount (0 = no gold rim)
  FADE_POWER: 1.8,                // How cleanly the fog clears (higher = less grey haze)

  // --- Fog shape ---
  CELL: 8,                        // Fog grid cell size in px (bigger = faster and softer)
  FOG_EVERY: 2,                   // Re-render fog texture every N frames
  FOG_SCALE: 0.045,               // Cloud blob size (smaller = bigger blobs)
  FOG_SPEED: 0.0035,              // Fog flow speed

  // --- Clearing / closing ---
  REVEAL_PER_PX: 0.00045,         // Reveal added per 1px of mouse movement (smaller = move longer)
  REVEAL_SPEED: 0.0035,           // Max reveal per frame (smaller = slower; 0.002 ≈ 10s to fully clear)
  EDGE: 0.16,                     // Softness of the clearing edge
  DIST_WEIGHT: 0.55,              // 0 = random patches; 1 = pure circle expanding from the mouse
  CLOSE_SECONDS: 5,               // Seconds to fully close after isIdle (higher = slower)
  IDLE_MS: 10000,                 // Fallback idle timer only (used if isIdle is missing)
};

// ===== ② Cloud pattern settings (same as original, now full screen) =====
const P1_CLOUD = {
  GUIDE_SRC: 'photo/cloud.png', // Path to the cloud guide image (relative to index.html)

  OFFSET_Y: 0,            // Start from the top of the canvas
  HEAVEN_RATIO: 1,        // 1 = cover the full canvas height

  SPEED: 1.0,
  FADE: 2,
  FADE_EVERY: 8,          // [Trail fix] Erase once every 8 frames (same total), so trails fully disappear
  LIFE: 900,
  PULL: 0.12,             // Pull back onto the line (higher = sticks closer)
  GRACE: 8,               // Frames off the line before respawning
  THRESHOLD: 100,

  NOISE_SCALE: 0.01,      // Particle wobble
  NOISE_SPEED: 0.005,
  NOISE_TURN: 0.08,

  ALPHA: 70,
  WEIGHT: 4,
  COUNT: 3000,            // Keeps density at full screen; lower to 2000 if it lags

  // [Base layer] Faint cloud pattern underneath (generated from cloud.png)
  BASE_ALPHA: 0.12,               // Base strength: 0 = none, 0.12 = faint, 0.25 = visible
  BASE_COLOR: [205, 175, 125],    // Base color (soft gold-brown, blends with the brown background)

  // Cloud visibility field (patches of the pattern fade in and out)
  FOG_SCALE: 0.004,
  FOG_SPEED: 0.002,
  FOG_LOW: 0.35,
  FOG_HIGH: 0.65,

  // [Soft white] Each color: [R, G, B, alpha multiplier, weight multiplier]
  PALETTE: [
    [196, 160, 98, 1.0, 1.0],   // Gilded gold
    [230, 200, 140, 1.0, 1.0],  // Bright gold
    [235, 230, 220, 0.3, 0.6],  // Moon white (softened)
  ],
};

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
//  CODE BELOW — usually no need to edit
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★


class Part1 {
  constructor(cloudImg, options = {}) {
    this.cfg = Object.assign({}, P1_FOG, options);

    this.cloudImg = cloudImg;   // Can start as null; setCloudImage() fills it after loading
    this.pg = null;             // Particle trail layer
    this.basePg = null;         // Faint base pattern layer
    this.guide = null;          // Scaled copy of cloud.png
    this.dots = [];             // Particles
    this.w = width;             // Stored size, used to detect canvas resize
    this.h = height;

    this.revealMax = 1 + this.cfg.EDGE;
    this.reveal = 0;
    this.revealTarget = 0;
    this.ox = width / 2;
    this.oy = height / 2;
    this.lastActive = -Infinity;
    this.fullyClosed = true;

    this._buildFogGrid();
    this._buildCloud();
    this._renderFog();          // First frame is full fog
  }

  // Called once cloud.png has finished loading
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

  // ---------------------------------------------------------- Main loop
  update(idleState) {
    if (width !== this.w || height !== this.h) this.resize();   // Auto-detect resize

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
    if (this.basePg) image(this.basePg, 0, this.areaY);   // Faint base pattern first
    image(this.pg, 0, this.areaY);                        // Then the gold particles
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

  // ========================================================== ① Fog
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

  // ========================================================== ② Cloud pattern
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

    this._buildBase(w, hh);

    this.dots = [];
    for (let i = 0; i < C.COUNT; i++) this.dots.push(new P1CloudDot(this));
  }

  // Build a faint base layer from cloud.png lines.
  // Computed once on build, so it costs nothing per frame.
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
      let d = (255 - bri) * (src[o + 3] / 255) / 255;   // 0 = empty, 1 = ink line
      d = constrain((d - 0.2) / 0.6, 0, 1);               // Keep only the lines
      dst[o] = cr; dst[o + 1] = cg; dst[o + 2] = cb;
      dst[o + 3] = 255 * C.BASE_ALPHA * d;
    }
    bp.updatePixels();
    this.basePg = bp;
  }

  _updateCloud() {
    const C = P1_CLOUD;
    // Batched erase: every FADE_EVERY frames, erase FADE × FADE_EVERY.
    // Same total as before, but large enough not to be rounded to 0,
    // so old trails fully disappear instead of piling up as grey bands.
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


// ---------------------------------------------------------- CloudDot (original)
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
    const am = this.col[3] ?? 1;   // Alpha multiplier
    const wm = this.col[4] ?? 1;   // Weight multiplier
    const w = map(this.life, 0, this.maxLife, 0.3, C.WEIGHT) * wm;
    pg.stroke(this.col[0], this.col[1], this.col[2], C.ALPHA * fog * am);
    pg.strokeWeight(w);
    pg.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}


// ==========================================================
//  Framework hookup: replaces the two placeholder functions in sketch.js
// ==========================================================
let p1 = null;
let p1LastFrame = -1;

function p1System() {
  if (!p1) {
    p1 = new Part1(null);
    loadImage(
      P1_CLOUD.GUIDE_SRC,
      (img) => {
        p1.setCloudImage(img);
        console.log('[Part1] Cloud image loaded: ' + P1_CLOUD.GUIDE_SRC);
      },
      () => console.error('[Part1] Cannot find ' + P1_CLOUD.GUIDE_SRC +
                          ' — check the file name and path')
    );
  }
  return p1;
}

// Update only once per frame, even though two layers call it
function p1Tick(idleState) {
  if (p1LastFrame === frameCount) return;
  p1LastFrame = frameCount;
  p1System().update(idleState);
}

// [Layer 2] Above bg1, below bg2
function drawKristenClouds(idleState) {
  p1Tick(idleState);
  p1System().displayCloud();
}

// [Layer 7] Above sun/moon glow, below lantern
function drawKristenFog(idleState, mx, my) {
  p1Tick(idleState);
  p1System().displayFog();
}