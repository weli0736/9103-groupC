// =============================================================
// timebase-2.js 
// Author: Haocheng Gong 
// Role: Bottom layer artwork (Waves, glowing tree fruits, bell)
// =============================================================

class TimeBase2Module {
  constructor(w, h) {
    this.updateSize(w, h);
  }

  updateSize(w, h) {
    this.w = w;
    this.h = h;
  }

  display(bgElements) {
    // 1. Render the foreground environment elements (bg2.png)
    push();
    tint(210); // Brighten the image slightly to avoid muddy dark spots
    imageMode(CORNER);
    image(bgElements, 0, 0, this.w, this.h);
    pop();

    imageMode(CENTER);

    // Map a 10-second loop for all environment animations
    let cycleDuration = 10000; 
    let cycleProgress = (millis() % cycleDuration) / cycleDuration;

    // Calculate alternating sine intensities for the moon and sun elements
    let moonIntensity = cycleProgress < 0.5 ? sin(map(cycleProgress, 0, 0.5, 0, 1) * PI) : 0;
    let sunIntensity = cycleProgress >= 0.5 ? sin(map(cycleProgress, 0.5, 1.0, 0, 1) * PI) : 0;
    let bellIntensity = moonIntensity + sunIntensity;

    // 2. Render pulsing fruits for the Moon Tree
    if (moonIntensity > 0.01) this.drawMoonSystem(moonIntensity);
    // 3. Render pulsing fruits for the Sun Tree (Fusang)
    if (sunIntensity > 0.01) this.drawSunSystem(sunIntensity);
    // 4. Render the breathing halo for the Bronze Bell
    if (bellIntensity > 0.01) this.drawBellHaloGlow(bellIntensity);
    // 5. Render the flowing waves with fine-line textures
    this.drawStylizedWaves(cycleProgress);
  }

  // ================= Moon Tree System =================
  drawMoonSystem(intensity) {
    push();
    blendMode(ADD); // ADD mode creates a strong, luminous mythical glow
    
    // Main large glow
    this.drawBigGlow(this.w * 0.115, this.h * 0.16, this.w * 0.28, 200, 230, 255, intensity);
    let r = this.w * 0.11; // Radius for smaller fruits
    
    // Draw the surrounding small fruits
    this.drawBigGlow(this.w * 0.285, this.h * 0.115, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.355, this.h * 0.155, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.130, this.h * 0.350, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.050, this.h * 0.430, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.185, this.h * 0.480, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.245, this.h * 0.550, r, 200, 230, 255, intensity);
    pop();
  }

  // ================= Sun Tree (Fusang) System =================
  drawSunSystem(intensity) {
    push();
    blendMode(ADD);
    
    // Main large glow
    this.drawBigGlow(this.w * 0.905, this.h * 0.145, this.w * 0.28, 255, 60, 20, intensity);
    let r = this.w * 0.11; 
    
    // Draw the surrounding small fruits
    this.drawBigGlow(this.w * 0.725, this.h * 0.105, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.655, this.h * 0.175, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.695, this.h * 0.280, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.825, this.h * 0.275, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.935, this.h * 0.380, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.785, this.h * 0.525, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.855, this.h * 0.575, r, 255, 60, 20, intensity);
    pop();
  }

  // ================= Glow Rendering Algorithm =================
  drawBigGlow(x, y, maxRadius, r, g, b, intensity) {
    noStroke();
    let layers = 6; 
    let step = maxRadius / layers;
    
    // 1. Render soft multi-layered outer halos
    for (let i = maxRadius; i > 0; i -= step) {
      let progress = 1 - (i / maxRadius);
      // Using pow() creates a smoother, more harmonious falloff for the glow
      let alpha = pow(progress, 1.2) * 60 * intensity; 
      fill(r, g, b, alpha);
      ellipse(x, y, i, i);
    }
    
    // 2. Render a bright inner core so the fruit remains noticeable and refined
    fill(255, 255, 255, 180 * intensity);
    let coreRadius = maxRadius * 0.15;
    ellipse(x, y, coreRadius, coreRadius);
  }

  // ================= Bronze Bell Halo =================
  drawBellHaloGlow(intensity) {
    push();
    blendMode(ADD);
    let bellX = this.w * 0.5;
    let bellY = this.h * 0.15;
    
    // Center soft glow over the bell body itself
    noStroke();
    fill(255, 200, 80, 50 * intensity);
    ellipse(bellX, bellY, this.w * 0.08, this.w * 0.06);

    // Expand outward with thick, radiating energy rings
    noFill();
    let innerDiameter = this.w * 0.05;
    let outerDiameter = this.w * 0.22; 
    let layers = 12;
    let step = (outerDiameter - innerDiameter) / layers;
    
    for (let i = 0; i < layers; i++) {
      let d = innerDiameter + i * step;
      let progress = i / (layers - 1);
      let alpha = sin(progress * PI) * 45 * intensity; 
      
      stroke(255, 220, 100, alpha);
      strokeWeight(step * 1.8); 
      ellipse(bellX, bellY, d, d * 0.75);
    }
    pop();
  }

  // ================= Stylized Flowing Waves =================
  drawStylizedWaves(cycle) {
    push();
    let phase = cycle * TWO_PI;
    let waveColors = [
      color(68, 55, 45, 200), color(105, 125, 105, 230),
      color(150, 125, 90, 240), color(140, 75, 55, 255)
    ];
    
    // Build 4 overlapping wave blocks from background to foreground
    for (let i = 0; i < 4; i++) {
      let yBase = this.h - (4 - i) * (this.h * 0.04);
      let amp = this.h * 0.04 + i * 2;
      let freq = 0.012 - i * 0.001;
      let dir = (i % 2 === 0) ? 1 : -1;

      // 1. Draw the solid wave body
      fill(waveColors[i]);
      stroke(25, 20, 15);
      strokeWeight(3.5);
      beginShape();
      vertex(0, this.h);
      for (let x = 0; x <= this.w; x += 20) {
        // Combine two sine waves for an organic, rolling shape
        let yOffset = sin(x * freq + phase * dir + i * 2) * amp;
        let yOffset2 = cos(x * freq * 1.5 - phase * dir) * (amp * 0.3);
        vertex(x, yBase + yOffset + yOffset2);
      }
      vertex(this.w, this.h);
      endShape(CLOSE);

      // 2. Draw traditional Chinese fine-line textures inside the waves
      noFill();
      stroke(30, 25, 20, 180);
      strokeWeight(1.5);
      let innerLinesCount = 3 + i;
      
      for (let j = 1; j <= innerLinesCount; j++) {
        let lineSpacing = j * 8;
        beginShape();
        for (let x = 0; x <= this.w; x += 20) {
          let yOffset = sin(x * freq + phase * dir + i * 2) * amp;
          let yOffset2 = cos(x * freq * 1.5 - phase * dir) * (amp * 0.3);
          let waveY = yBase + yOffset + yOffset2 + lineSpacing;
          
          // Only draw lines if they haven't dropped off the bottom edge
          if (waveY <= this.h + 10) {
            vertex(x, waveY);
          }
        }
        endShape();
      }
    }
    pop();
  }
}