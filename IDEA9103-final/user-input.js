
/*
 * IDEA9103 - User Input
 * improved.js
 *
 * Load improved.js BEFORE sketch.js.
 * In setup(): setupJunyuLantern();
 * In draw(): drawJunyuLantern(isIdle);
 *
 * Required images:
 * photo/lantern-person-awake.png
 * photo/lantern-person-idle.png
 */

(() => {
  'use strict';

  const OPTIONS = {
    AWAKE_IMAGE: 'photo/lantern-person-awake.png',
    IDLE_IMAGE: 'photo/lantern-person-idle.png',

    SOURCE_WIDTH: 827,
    SOURCE_HEIGHT: 1003,

    ANCHOR_X: 500,
    ANCHOR_Y: 700,

    LAMP_X: 243,
    LAMP_Y: 365,

    IMAGE_WIDTH_RATIO: 0.065,

    START_X: 0.62,
    START_Y: 0.70,

    FOLLOW_TIME_SECONDS: 0.025,

    // About 5 seconds to reach 95% awake
    CHANGE_TIME_SECONDS: 1.67,

    // Outer glow
    IDLE_GLOW_RATIO: 0.30,
    AWAKE_GLOW_RATIO: 0.78,

    IDLE_LIGHT_ALPHA: 0.25,
    AWAKE_LIGHT_ALPHA: 0.70,

    // Central lantern light
    CORE_DIAMETER_RATIO_IDLE: 0.075,
    CORE_DIAMETER_RATIO_AWAKE: 0.095,

    CORE_BRIGHTNESS_IDLE: 0.65,
    CORE_BRIGHTNESS_AWAKE: 1.0,

    // Floating particles
    TRAIL_RATE: 18,
    TRAIL_MAX_PARTICLES: 70
  };

  let awakeImage = null;
  let idleImage = null;

  let initialized = false;

  let anchorX = 0;
  let anchorY = 0;

  let awakeMix = 0;

  let particles = [];
  let spawnAccumulator = 0;

  // ----------------------------------------
  // Load images
  // ----------------------------------------

  function setupJunyuLantern() {
    if (initialized) return;

    initialized = true;

    anchorX = width * OPTIONS.START_X;
    anchorY = height * OPTIONS.START_Y;

    loadImage(
      OPTIONS.AWAKE_IMAGE,
      img => {
        awakeImage = img;
      },
      err => {
        console.warn(
          '[Junyu] Cannot load awake PNG:',
          OPTIONS.AWAKE_IMAGE,
          err
        );
      }
    );

    loadImage(
      OPTIONS.IDLE_IMAGE,
      img => {
        idleImage = img;
      },
      err => {
        console.warn(
          '[Junyu] Cannot load idle PNG:',
          OPTIONS.IDLE_IMAGE,
          err
        );
      }
    );
  }

  // ----------------------------------------
  // Outer glow
  // ----------------------------------------

  function paintOuterGlow(x, y, diameter, mix) {
    const r = Math.round(lerp(88, 255, mix));
    const g = Math.round(lerp(120, 204, mix));
    const b = Math.round(lerp(190, 102, mix));

    const alpha = lerp(
      OPTIONS.IDLE_LIGHT_ALPHA,
      OPTIONS.AWAKE_LIGHT_ALPHA,
      mix
    );

    const ctx = drawingContext;

    ctx.save();

    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, diameter / 2
    );

    gradient.addColorStop(
      0,
      `rgba(${r},${g},${b},${alpha})`
    );

    gradient.addColorStop(
      0.25,
      `rgba(${r},${g},${b},${alpha * 0.48})`
    );

    gradient.addColorStop(
      0.65,
      `rgba(${r},${g},${b},${alpha * 0.10})`
    );

    gradient.addColorStop(
      1,
      `rgba(${r},${g},${b},0)`
    );

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, diameter / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ----------------------------------------
  // Floating blue / golden particles
  // ----------------------------------------

  function drawSoftParticles(x, y, imageWidth, mix, dt) {
    const amount = 0.18 + 1.05 * mix;

    spawnAccumulator += (
      dt * OPTIONS.TRAIL_RATE * amount
    );

    while (
      spawnAccumulator >= 1 &&
      particles.length < OPTIONS.TRAIL_MAX_PARTICLES
    ) {
      spawnAccumulator--;

      particles.push({
        dx: random(-0.04, 0.04) * imageWidth,
        dy: random(-0.03, 0.03) * imageWidth,

        vx: random(-0.025, 0.025) * imageWidth,
        vy: random(-0.16, -0.055) * imageWidth,

        life: 1,
        duration: random(1.2, 2.0),

        radius: random(0.003, 0.010) * imageWidth
      });
    }

    if (particles.length >= OPTIONS.TRAIL_MAX_PARTICLES) {
      spawnAccumulator = 0;
    }

    push();
    blendMode(ADD);
    noStroke();

    const cr = lerp(115, 255, mix);
    const cg = lerp(178, 218, mix);
    const cb = lerp(255, 115, mix);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.dx += p.vx * dt;
      p.dy += p.vy * dt;

      p.life -= dt / p.duration;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const alpha =
        p.life * p.life * (12 + 34 * mix);

      // Soft trailing afterimage
      fill(cr, cg, cb, alpha * 0.55);

      circle(
        x + p.dx - p.vx * 0.08,
        y + p.dy - p.vy * 0.08,
        p.radius * 3.8
      );

      // Soft particle glow
      fill(cr, cg, cb, alpha);

      circle(
        x + p.dx,
        y + p.dy,
        p.radius * 2.2
      );

      // Brighter particle centre
      fill(cr, cg, cb, alpha * 1.8);

      circle(
        x + p.dx,
        y + p.dy,
        p.radius
      );
    }

    pop();
  }

  // ----------------------------------------
  // Always-visible lantern core
  // ----------------------------------------

  function drawLanternCore(x, y, imageWidth, mix) {
    const t = millis() / 1000;

    const diameter = imageWidth * lerp(
      OPTIONS.CORE_DIAMETER_RATIO_IDLE,
      OPTIONS.CORE_DIAMETER_RATIO_AWAKE,
      mix
    );

    const strength = lerp(
      OPTIONS.CORE_BRIGHTNESS_IDLE,
      OPTIONS.CORE_BRIGHTNESS_AWAKE,
      mix
    );

    const breathing = 1 + 0.055 * sin(t * 2.3);

    const r = Math.round(lerp(112, 255, mix));
    const g = Math.round(lerp(172, 223, mix));
    const b = Math.round(lerp(255, 145, mix));

    push();
    blendMode(ADD);
    noStroke();

    // Soft inner light rings
    for (let i = 5; i >= 1; i--) {
      const factor = i / 5;

      fill(
        r,
        g,
        b,
        (6 + (1 - factor) * 19) * strength
      );

      circle(
        x,
        y,
        diameter * (1.1 + factor * 1.7) * breathing
      );
    }

    // Main light centre
    fill(
      r,
      g,
      b,
      lerp(120, 165, mix) * strength
    );

    circle(
      x,
      y,
      diameter * 0.72
    );

    // Idle: soft blue, not pure white
    // Awake: brighter warm gold-white
    fill(
      lerp(150, 255, mix),
      lerp(190, 242, mix),
      lerp(245, 205, mix),
      lerp(70, 205, mix) * strength
    );

    circle(
      x,
      y,
      diameter * 0.34
    );

    // Slowly rotating highlight
    const angle = t * 0.85;

    fill(
      lerp(145, 255, mix),
      lerp(190, 251, mix),
      lerp(255, 214, mix),
      lerp(25, 90, mix) * strength
    );

    circle(
      x + cos(angle) * diameter * 0.35,
      y + sin(angle) * diameter * 0.23,
      diameter * 0.33
    );

    pop();
  }

  // ----------------------------------------
  // Main character animation
  // ----------------------------------------

  function drawJunyuLantern(idleState) {
    if (!initialized) {
      setupJunyuLantern();
    }

    const idle =
      typeof idleState === 'boolean'
        ? idleState
        : (
            typeof isIdle !== 'undefined'
              ? Boolean(isIdle)
              : true
          );

    const inside =
      mouseX >= 0 &&
      mouseX <= width &&
      mouseY >= 0 &&
      mouseY <= height;

    const dt = Math.min(
      Math.max(
        typeof deltaTime === 'number'
          ? deltaTime / 1000
          : 1 / 60,
        0
      ),
      0.1
    );

    const followFactor =
      1 - Math.exp(
        -dt / OPTIONS.FOLLOW_TIME_SECONDS
      );

    const transitionFactor =
      1 - Math.exp(
        -dt / OPTIONS.CHANGE_TIME_SECONDS
      );

    // Mouse controls the character's waist
    if (!idle && inside) {
      anchorX += (
        mouseX - anchorX
      ) * followFactor;

      anchorY += (
        mouseY - anchorY
      ) * followFactor;
    }

    // Slow transition between sleeping and awake
    awakeMix += (
      (idle ? 0 : 1) - awakeMix
    ) * transitionFactor;

    awakeMix = constrain(awakeMix, 0, 1);

    // Character dimensions
    const imageWidth =
      width * OPTIONS.IMAGE_WIDTH_RATIO;

    const imageHeight =
      imageWidth *
      OPTIONS.SOURCE_HEIGHT /
      OPTIONS.SOURCE_WIDTH;

    const scale =
      imageWidth / OPTIONS.SOURCE_WIDTH;

    const left =
      anchorX - OPTIONS.ANCHOR_X * scale;

    const top =
      anchorY - OPTIONS.ANCHOR_Y * scale;

    // Light stays attached to the lantern
    const lampX =
      left + OPTIONS.LAMP_X * scale;

    const lampY =
      top + OPTIONS.LAMP_Y * scale;

    const glowDiameter =
      imageWidth * lerp(
        OPTIONS.IDLE_GLOW_RATIO,
        OPTIONS.AWAKE_GLOW_RATIO,
        awakeMix
      );

    push();

    imageMode(CORNER);
    blendMode(BLEND);
    noTint();

    // 1. Soft outer glow behind the figure
    paintOuterGlow(
      lampX,
      lampY,
      glowDiameter,
      awakeMix
    );

    // 2. Floating particles and afterimages
    drawSoftParticles(
      lampX,
      lampY,
      imageWidth,
      awakeMix,
      dt
    );

    // 3. Crossfade between the two PNG images
    if (idleImage && awakeImage) {
      tint(255, 255);

      image(
        idleImage,
        left,
        top,
        imageWidth,
        imageHeight
      );

      if (awakeMix > 0.001) {
        tint(255, 255 * awakeMix);

        image(
          awakeImage,
          left,
          top,
          imageWidth,
          imageHeight
        );
      }

    } else if (idleImage || awakeImage) {
      noTint();

      image(
        idleImage || awakeImage,
        left,
        top,
        imageWidth,
        imageHeight
      );
    }

    noTint();

    // 4. Central blue / gold lantern light
    drawLanternCore(
      lampX,
      lampY,
      imageWidth,
      awakeMix
    );

    pop();
  }

  // ----------------------------------------
  // Public functions for sketch.js
  // ----------------------------------------

  window.setupJunyuLantern = setupJunyuLantern;
  window.drawJunyuLantern = drawJunyuLantern;

  window.JunyuLantern = {
    getState: () => ({
      initialized,
      awakeMix,
      anchorX,
      anchorY,
      particles: particles.length
    }),

    getSettings: () => ({
      ...OPTIONS
    })
  };

})();
