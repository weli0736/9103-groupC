// =============================================================
// perlin-noise.js — Kristen Li — Heavenly Cloud Layer
//
// 1. Moon-white fog:
//    Mouse movement gradually clears the fog.
//    Idle mode restores the fog.
//
// 2. Golden cloud patterns:
//    Image gradients guide particles along cloud.png contours.
//    Perlin noise adds a small wobble to their movement.
//
// Framework integration:
//    drawKristenClouds() draws the cloud-pattern layer.
//    drawKristenFog() draws the foreground fog layer.
//    Both share one update per frame through p1Tick().
//
// Load this file after sketch.js.
// Actual layer order depends on the drawing order in sketch.js.
//
// Attribution:
//    [REF] identifies external references and image sources.
//    [AI] identifies Claude-assisted sections based on the
//    author's declared use of AI.
// =============================================================


// =============================================================
// SETTINGS
// =============================================================

// -------------------------------------------------------------
// 1. Fog appearance, rendering, and interaction
// -------------------------------------------------------------
const P1_FOG = {
  // Fog colour and opacity.
  FOG_ALPHA: 245,                // Maximum opacity; 255 is fully opaque.
  FOG_DARK: 186,                 // Brightness of darker fog regions.
  FOG_LIGHT: 250,                // Brightness of lighter fog regions.
  FOG_CONTRAST: 1.25,            // Higher values increase contrast.
  FOG_TINT: [1.0, 0.985, 0.945], // RGB multipliers for warm-white fog.

  // Highlight around partially revealed areas.
  RIM_LIGHT: 26,
  RIM_GOLD: [232, 204, 150],
  RIM_GOLD_MIX: 0.45,

  // Higher values remove more haze from revealed areas.
  FADE_POWER: 1.8,

  // Render fog on a small grid, then enlarge it on the main canvas.
  CELL: 8,                      // Canvas pixels represented by one grid cell.
  FOG_EVERY: 2,                 // Render the fog texture every N frames.
  FOG_SCALE: 0.045,             // Smaller values produce larger fog shapes.
  FOG_SPEED: 0.0035,            // Noise animation speed per frame.

  // Mouse movement increases the reveal target.
  // The actual reveal is capped per frame to prevent instant clearing.
  REVEAL_PER_PX: 0.00045,
  REVEAL_SPEED: 0.0035,
  EDGE: 0.16,                   // Softness of the reveal boundary.
  DIST_WEIGHT: 0.55,            // Balance between mouse distance and noise.

  // Closing duration assumes approximately 60 frames per second.
  CLOSE_SECONDS: 5,

  // Used only when no shared idle state is available.
  IDLE_MS: 10000,
};


// -------------------------------------------------------------
// 2. Image-guided cloud particles
// -------------------------------------------------------------
const P1_CLOUD = {
  // [REF] Cloud motif from 中国纹样全集, accessed via Pinterest.
  // Source: https://ch.pinterest.com/pin/5488830777107015/
  // Used to guide particle paths and generate the faint base pattern.
  GUIDE_SRC: 'photo/cloud.png',

  // Pattern placement.
  // The available area may also be limited by heavenTop and earthTop.
  OFFSET_Y: 0,
  HEAVEN_RATIO: 1,

  // Particle movement and lifetime.
  SPEED: 1.0,
  FADE: 2,
  FADE_EVERY: 8,
  LIFE: 900,                    // Particle lifetime in frames.
  PULL: 0.12,                   // Attraction towards stronger image lines.
  GRACE: 8,                     // Allowed frames away from a line.
  THRESHOLD: 100,               // Minimum line strength used for spawning.

  // Small noise-driven changes in particle direction.
  NOISE_SCALE: 0.01,
  NOISE_SPEED: 0.005,
  NOISE_TURN: 0.08,

  // Particle appearance.
  ALPHA: 70,
  WEIGHT: 4,
  COUNT: 3000,

  // A faint static version of the cloud image beneath the particles.
  BASE_ALPHA: 0.12,
  BASE_COLOR: [205, 175, 125],

  // Separate noise field that varies particle visibility.
  // This is independent of the interactive foreground fog mask.
  FOG_SCALE: 0.004,
  FOG_SPEED: 0.002,
  FOG_LOW: 0.35,
  FOG_HIGH: 0.65,

  // Each entry: [red, green, blue, alpha multiplier, weight multiplier].
  PALETTE: [
    [196, 160, 98, 1.0, 1.0],   // Gilded gold.
    [230, 200, 140, 1.0, 1.0],  // Bright gold.
    [235, 230, 220, 0.3, 0.6],  // Soft moon white.
  ],
};


// =============================================================
// MAIN CLOUD AND FOG SYSTEM
// =============================================================
class Part1 {
  constructor(cloudImg, options = {}) {
    // Allow selected fog settings to be overridden when creating Part1.
    this.cfg = Object.assign({}, P1_FOG, options);

    // The system can start before the guide image finishes loading.
    this.cloudImg = cloudImg;
    this.pg = null;            // Persistent particle-trail buffer.
    this.basePg = null;        // Static cloud-pattern buffer.
    this.guide = null;         // Resized image used for pixel sampling.
    this.dots = [];

    // Store canvas dimensions to detect resizing.
    this.w = width;
    this.h = height;

    // Global reveal progress and its movement-driven target.
    // revealMax includes the soft edge so the mask can fully open.
    this.revealMax = 1 + this.cfg.EDGE;
    this.reveal = 0;
    this.revealTarget = 0;

    // Current origin of the reveal field.
    this.ox = width / 2;
    this.oy = height / 2;

    // Start idle until interaction or a shared state activates the system.
    this.lastActive = -Infinity;
    this.fullyClosed = true;

    this._buildFogGrid();
    this._buildCloud();
    this._renderFog();
  }

  // Called after the guide image loads successfully.
  setCloudImage(img) {
    this.cloudImg = img;
    this._buildCloud();
  }

  // Rebuild size-dependent buffers and reset the fog after resizing.
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

  // -----------------------------------------------------------
  // Update interaction, fog state, and particles.
  // idleState takes priority over the global or fallback timer.
  // -----------------------------------------------------------
  update(idleState) {
    if (width !== this.w || height !== this.h) {
      this.resize();
    }

    const c = this.cfg;

    // Only movement inside the canvas contributes to revealing.
    const inside =
      mouseX >= 0 &&
      mouseX <= width &&
      mouseY >= 0 &&
      mouseY <= height;

    // Limit movement distance per frame to reduce sudden reveal jumps.
    const mv = inside
      ? Math.min(60, dist(mouseX, mouseY, pmouseX, pmouseY))
      : 0;

    // Track activity for the fallback timer.
    // Holding the mouse button also keeps this local timer active.
    if (mv > 0.5 || mouseIsPressed) {
      this.lastActive = millis();
    }

    const idle = (typeof idleState === 'boolean')
      ? idleState
      : this._readIdle();

    // [AI] Claude assisted with reveal-speed control and idle recovery.
    // Movement raises the target; actual clearing is capped per frame.
    // When idle, reveal progress decreases and the fog closes.
    if (!idle) {
      if (mv > 0.5) {
        this.revealTarget = Math.min(
          this.revealMax,
          this.revealTarget + mv * c.REVEAL_PER_PX
        );

        this.ox = mouseX;
        this.oy = mouseY;
      }

      // Continue towards the target, even between movement events.
      this.reveal = Math.min(
        this.revealTarget,
        this.reveal + c.REVEAL_SPEED
      );

      this._applyMask(true);
      this.fullyClosed = false;
    } else if (!this.fullyClosed) {
      // Frame-based closing, calibrated for approximately 60 FPS.
      this.reveal = Math.max(
        0,
        this.reveal - this.revealMax / (c.CLOSE_SECONDS * 60)
      );

      this.revealTarget = this.reveal;
      this._applyMask(false);

      if (this.reveal === 0) {
        this.mask.fill(0);
        this.fullyClosed = true;
      }
    }

    // Particles continue updating beneath the foreground fog.
    if (this.pg) {
      this._updateCloud();
    }

    // Render less often to reduce pixel-processing work.
    if (frameCount % c.FOG_EVERY === 0 || frameCount < 3) {
      this._renderFog();
    }
  }

  // Draw the static cloud image first, then the animated trails.
  displayCloud() {
    if (!this.pg) return;

    push();
    blendMode(BLEND);
    imageMode(CORNER);
    noTint();

    if (this.basePg) {
      image(this.basePg, 0, this.areaY);
    }

    image(this.pg, 0, this.areaY);
    pop();
  }

  // Enlarge the low-resolution fog texture to cover the canvas.
  displayFog() {
    const c = this.cfg;

    push();
    blendMode(BLEND);
    imageMode(CORNER);
    noTint();

    image(
      this.fogG,
      -c.CELL / 2,
      -c.CELL / 2,
      this.cols * c.CELL,
      this.rows * c.CELL
    );

    pop();
  }

  // Convenience method when both layers are drawn together.
  display() {
    this.displayCloud();
    this.displayFog();
  }

  // Prefer Haocheng's shared idle state.
  // Use a local inactivity timer only if the global state is absent.
  _readIdle() {
    if (typeof isIdle !== 'undefined') {
      return !!isIdle;
    }

    return millis() - this.lastActive > this.cfg.IDLE_MS;
  }


  // ===========================================================
  // 1. FOREGROUND FOG
  // ===========================================================

  // [AI] Claude assisted with the low-resolution fog grid.
  // It stores reveal values and noise variation in typed arrays.
  // A small graphics buffer reduces the cost of pixel rendering.
  _buildFogGrid() {
    const c = this.cfg;

    // Extra cells prevent gaps along the canvas edges.
    this.cols = Math.ceil(width / c.CELL) + 1;
    this.rows = Math.ceil(height / c.CELL) + 1;

    const n = this.cols * this.rows;

    // mask: 0 = covered, 1 = clear.
    // grain: fixed noise variation that shapes the reveal boundary.
    this.mask = new Float32Array(n);
    this.grain = new Float32Array(n);

    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const v =
          noise(i * 0.11 + 300, j * 0.11 + 300) * 0.7 +
          noise(i * 0.35 + 500, j * 0.35 + 500) * 0.3;

        this.grain[j * this.cols + i] = constrain(
          (v - 0.28) / 0.44,
          0,
          1
        );
      }
    }

    // [REF] p5.js createGraphics():
    // https://p5js.org/reference/p5/createGraphics/
    // Render fog separately from the main canvas.
    this.fogG = createGraphics(this.cols, this.rows);

    // One pixel per grid cell keeps pixel-array indexing predictable.
    this.fogG.pixelDensity(1);

    // Normalisation distance for the mouse-centred reveal field.
    this.maxD = dist(0, 0, width, height) * 0.8;
  }

  // [AI] Claude assisted with the reveal mask.
  // Mouse distance and fixed noise variation form a soft threshold.
  // Opening preserves cleared areas; closing only reduces visibility.
  _applyMask(open) {
    const c = this.cfg;
    const cols = this.cols;
    const inv = 1 / c.EDGE;
    const dw = c.DIST_WEIGHT;
    const gw = 1 - dw;

    for (let j = 0; j < this.rows; j++) {
      const dy = j * c.CELL - this.oy;

      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const dx = i * c.CELL - this.ox;

        // Normalised distance from the current reveal origin.
        const dn = Math.min(
          1,
          Math.sqrt(dx * dx + dy * dy) / this.maxD
        );

        // Mix radial distance with noise for an irregular opening.
        const f = dw * dn + gw * this.grain[k];

        let v = (this.reveal - f) * inv;
        v = v < 0 ? 0 : v > 1 ? 1 : v;

        // Moving the origin must not immediately cover revealed cells.
        // During closing, the reverse rule prevents cells reopening.
        if (open ? v > this.mask[k] : v < this.mask[k]) {
          this.mask[k] = v;
        }
      }
    }
  }

  // [AI] Claude assisted with fog rendering.
  // Warped noise controls brightness.
  // The reveal mask controls opacity and a warm boundary highlight.
  _renderFog() {
    const c = this.cfg;
    const g = this.fogG;
    const cols = this.cols;
    const t = frameCount * c.FOG_SPEED;

    const [tr, tg, tb] = c.FOG_TINT;
    const [gr, gg, gb] = c.RIM_GOLD;

    g.loadPixels();
    const px = g.pixels;

    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const idx = k * 4;
        const m = this.mask[k];

        // Smoothstep reduces hard transitions at the reveal boundary.
        const s = m * m * (3 - 2 * m);

        // A clear mask cell produces little or no fog opacity.
        const a = c.FOG_ALPHA * Math.pow(1 - s, c.FADE_POWER);

        if (a < 1) {
          px[idx + 3] = 0;
          continue;
        }

        const x = i * c.FOG_SCALE;
        const y = j * c.FOG_SCALE * 1.6;

        // [REF] p5.js noise():
        // https://p5js.org/reference/p5/noise/
        // Nearby sampling coordinates produce smoothly related values.

        // Domain warping: noise offsets the next noise sample's coordinates.
        // A second noise layer adds smaller-scale detail.
        const w = noise(
          x * 0.5 + t,
          y * 0.5 - t * 0.5,
          7.3
        );

        let v =
          noise(x + w * 2 - t * 0.6, y + w * 1.2, t) * 0.65 +
          noise(x * 2.3 + 40, y * 2.3, t * 1.5) * 0.35;

        // Remap the noise and increase cloud contrast.
        v = constrain((v - 0.25) / 0.5, 0, 1);
        v = constrain(
          0.5 + (v - 0.5) * c.FOG_CONTRAST,
          0,
          1
        );

        // The highlight peaks in partially revealed cells.
        const rim = 4 * m * (1 - m);

        const lum =
          c.FOG_DARK +
          (c.FOG_LIGHT - c.FOG_DARK) * v +
          rim * c.RIM_LIGHT;

        let r = lum * tr;
        let gch = lum * tg;
        let b = lum * tb;

        // Blend a soft gold tint into the opening boundary.
        const gm = rim * c.RIM_GOLD_MIX;

        r += (gr - r) * gm;
        gch += (gg - gch) * gm;
        b += (gb - b) * gm;

        px[idx] = r;
        px[idx + 1] = gch;
        px[idx + 2] = b;
        px[idx + 3] = a;
      }
    }

    g.updatePixels();
  }


  // ===========================================================
  // 2. CLOUD PATTERN AND PARTICLE BUFFERS
  // ===========================================================

  _buildCloud() {
    if (!this.cloudImg) return;

    const C = P1_CLOUD;

    // Use the framework's heaven boundary when available.
    const base = (typeof heavenTop !== 'undefined')
      ? heavenTop
      : 0;

    this.areaY = Math.max(0, base + C.OFFSET_Y);

    let h = height * C.HEAVEN_RATIO;

    // Keep cloud patterns above the earth boundary when supplied.
    if (typeof earthTop !== 'undefined' && earthTop > this.areaY) {
      h = Math.min(h, earthTop - this.areaY);
    }

    this.areaW = width;
    this.areaH = h;

    const w = Math.ceil(this.areaW);
    const hh = Math.ceil(this.areaH);

    // Replace the previous particle buffer after a rebuild.
    if (this.pg) {
      this.pg.remove();
    }

    // [REF] p5.js createGraphics():
    // https://p5js.org/reference/p5/createGraphics/
    // Keep particle trails on a separate persistent drawing buffer.
    this.pg = createGraphics(w, hh);
    this.pg.clear();

    // Resize the guide image to match particle-space coordinates.
    this.guide = createImage(w, hh);

    this.guide.copy(
      this.cloudImg,
      0,
      0,
      this.cloudImg.width,
      this.cloudImg.height,
      0,
      0,
      w,
      hh
    );

    this.guide.loadPixels();

    this._buildBase(w, hh);

    this.dots = [];

    for (let i = 0; i < C.COUNT; i++) {
      this.dots.push(new P1CloudDot(this));
    }
  }

  // Convert dark image lines into a faint gold base pattern.
  // This is calculated only when the cloud buffers are rebuilt.
  _buildBase(w, hh) {
    const C = P1_CLOUD;

    if (this.basePg) {
      this.basePg.remove();
      this.basePg = null;
    }

    if (C.BASE_ALPHA <= 0) return;

    const bp = createGraphics(w, hh);
    bp.pixelDensity(1);
    bp.loadPixels();

    const src = this.guide.pixels;
    const dst = bp.pixels;
    const [cr, cg, cb] = C.BASE_COLOR;

    for (let k = 0; k < w * hh; k++) {
      const o = k * 4;
      const bri = (src[o] + src[o + 1] + src[o + 2]) / 3;

      // Invert brightness so dark lines become strong values.
      // Transparent pixels contribute no line strength.
      let d = (255 - bri) * (src[o + 3] / 255) / 255;

      // Remove weak background tones and retain stronger lines.
      d = constrain((d - 0.2) / 0.6, 0, 1);

      dst[o] = cr;
      dst[o + 1] = cg;
      dst[o + 2] = cb;
      dst[o + 3] = 255 * C.BASE_ALPHA * d;
    }

    bp.updatePixels();
    this.basePg = bp;
  }

  // Fade previous trails, then update and draw every particle.
  _updateCloud() {
    const C = P1_CLOUD;

    // [REF] p5.js erase():
    // https://p5js.org/reference/p5/erase/
    // A translucent erasing rectangle gradually removes old trails.

    // Batch erasing into stronger, less frequent passes.
    // This helps faint trails disappear instead of remaining as bands.
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

  // Return image line strength, rather than ordinary brightness.
  // Dark opaque pixels return larger values; white/transparent pixels return 0.
  brightnessAt(x, y) {
    const ix = Math.floor(
      constrain(x, 0, this.guide.width - 1)
    );

    const iy = Math.floor(
      constrain(y, 0, this.guide.height - 1)
    );

    const idx = 4 * (iy * this.guide.width + ix);
    const p = this.guide.pixels;
    const bri = (p[idx] + p[idx + 1] + p[idx + 2]) / 3;

    return (255 - bri) * (p[idx + 3] / 255);
  }

  // Estimate the image gradient with neighbouring pixel samples.
  // It points towards increasing line strength.
  gradientAt(x, y) {
    const d = 2;

    const gx =
      this.brightnessAt(x + d, y) -
      this.brightnessAt(x - d, y);

    const gy =
      this.brightnessAt(x, y + d) -
      this.brightnessAt(x, y - d);

    return createVector(gx, gy);
  }

  // Separate animated visibility field for cloud particles.
  // This does not read the interactive foreground reveal mask.
  fogDensityAt(x, y) {
    const C = P1_CLOUD;

    const n = noise(
      x * C.FOG_SCALE + 1000,
      y * C.FOG_SCALE + 1000,
      frameCount * C.FOG_SPEED
    );

    const t = constrain(
      (n - C.FOG_LOW) / (C.FOG_HIGH - C.FOG_LOW),
      0,
      1
    );

    // Smoothstep gives soft transitions between visible and hidden.
    return t * t * (3 - 2 * t);
  }
}


// =============================================================
// IMAGE-GUIDED CLOUD PARTICLES
// =============================================================
class P1CloudDot {
  constructor(parent) {
    this.parent = parent;
    this.spawn();
  }

  // Place a particle on a strong image line where possible.
  spawn() {
    const p = this.parent;
    const C = P1_CLOUD;

    let x;
    let y;

    // Limit attempts to avoid an endless search on a weak/empty image.
    for (let tries = 0; tries < 100; tries++) {
      x = random(p.guide.width);
      y = random(p.guide.height);

      if (p.brightnessAt(x, y) > C.THRESHOLD) {
        break;
      }
    }

    this.pos = createVector(x, y);
    this.prev = this.pos.copy();

    const g = p.gradientAt(x, y);

    // A perpendicular vector follows the local image contour.
    this.vel = createVector(-g.y, g.x);

    // Flat image regions have no useful gradient.
    if (this.vel.mag() < 0.001) {
      this.vel = p5.Vector.random2D();
    }

    // Allow particles to travel in either direction along a contour.
    if (random() < 0.5) {
      this.vel.mult(-1);
    }

    this.vel.setMag(C.SPEED);

    this.grace = C.GRACE;
    this.col = random(C.PALETTE);
    this.life = random(C.LIFE * 0.5, C.LIFE);
    this.maxLife = this.life;
  }

  update() {
    const p = this.parent;
    const C = P1_CLOUD;

    const g = p.gradientAt(this.pos.x, this.pos.y);
    const tangent = createVector(-g.y, g.x);

    // Choose the tangent direction closest to current movement.
    // This avoids sudden reversals along the same contour.
    if (tangent.dot(this.vel) < 0) {
      tangent.mult(-1);
    }

    if (tangent.mag() > 0.001) {
      tangent.setMag(C.SPEED);

      // Pull slightly towards stronger image lines.
      const pull = g.copy()
        .limit(C.SPEED * 2)
        .mult(C.PULL);

      // Gradually steer towards the tangent instead of snapping.
      this.vel.add(
        p5.Vector.sub(tangent, this.vel).mult(0.2)
      );

      this.vel.add(pull);
      this.vel.setMag(C.SPEED);
    }

    // [REF] Noise-driven particle movement inspired by daydev.
    // Source: https://openprocessing.org/@daydev/2659627/
    // The reference maps noise values to movement angles.
    // Here, image gradients guide the path; noise adds a small rotation.
    const n = noise(
      this.pos.x * C.NOISE_SCALE,
      this.pos.y * C.NOISE_SCALE,
      frameCount * C.NOISE_SPEED
    );

    this.vel.rotate(
      map(n, 0, 1, -C.NOISE_TURN, C.NOISE_TURN)
    );

    // Store the previous position to draw a short trail segment.
    this.prev = this.pos.copy();
    this.pos.add(this.vel);
    this.life--;

    // Allow a short period off the image line before respawning.
    if (
      p.brightnessAt(this.pos.x, this.pos.y) <
      C.THRESHOLD * 0.4
    ) {
      this.grace--;
    } else {
      this.grace = C.GRACE;
    }

    // Respawn old particles, particles off the guide, or off-canvas particles.
    if (
      this.life <= 0 ||
      this.grace <= 0 ||
      this.pos.x < 0 ||
      this.pos.x >= p.guide.width ||
      this.pos.y < 0 ||
      this.pos.y >= p.guide.height
    ) {
      this.spawn();
    }
  }

  draw(pg) {
    const C = P1_CLOUD;

    // Modulate particle opacity with the separate visibility field.
    const fog = this.parent.fogDensityAt(
      this.pos.x,
      this.pos.y
    );

    if (fog <= 0.01) return;

    const am = this.col[3] ?? 1;
    const wm = this.col[4] ?? 1;

    // Older particles draw thinner lines.
    const w = map(
      this.life,
      0,
      this.maxLife,
      0.3,
      C.WEIGHT
    ) * wm;

    pg.stroke(
      this.col[0],
      this.col[1],
      this.col[2],
      C.ALPHA * fog * am
    );

    pg.strokeWeight(w);

    pg.line(
      this.prev.x,
      this.prev.y,
      this.pos.x,
      this.pos.y
    );
  }
}


// =============================================================
// FRAMEWORK INTEGRATION
// Replaces the corresponding placeholder functions in sketch.js.
// =============================================================
let p1 = null;
let p1LastFrame = -1;

// Create the system on its first use.
// Fog can render immediately while the cloud image loads.
function p1System() {
  if (!p1) {
    p1 = new Part1(null);

    loadImage(
      P1_CLOUD.GUIDE_SRC,

      (img) => {
        p1.setCloudImage(img);

        console.log(
          '[Part1] Cloud image loaded: ' +
          P1_CLOUD.GUIDE_SRC
        );
      },

      () => {
        console.error(
          '[Part1] Cannot find ' +
          P1_CLOUD.GUIDE_SRC +
          ' — check the file name and path'
        );
      }
    );
  }

  return p1;
}

// Both drawing hooks call this function.
// The frame guard prevents particles and reveal progress updating twice.
function p1Tick(idleState) {
  if (p1LastFrame === frameCount) return;

  p1LastFrame = frameCount;
  p1System().update(idleState);
}

// Intended Layer 2: above bg1, below bg2.
// The actual order is determined by calls in sketch.js.
function drawKristenClouds(idleState) {
  p1Tick(idleState);
  p1System().displayCloud();
}

// Intended Layer 7: above sun/moon glow, below the lantern.
// mx and my are retained for framework compatibility.
// This version reads p5.js mouseX and mouseY inside update().
function drawKristenFog(idleState, mx, my) {
  p1Tick(idleState);
  p1System().displayFog();
}
