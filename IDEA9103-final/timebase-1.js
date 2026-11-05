// =============================================================
// timebase-1.js 
// Author: Haocheng Gong 
// Role: Sun & Moon Cycle (Clean design, large scale, edge-safe)
// =============================================================

class TimeBase1Module {
  constructor(w, h) {
    this.part2 = new Part2(w, h);
  }

  updateSize(w, h) {
    if (this.part2) {
      this.part2.updateSize(w, h);
    }
  }

  display() {
    // Link with the fog module. 
    // [AI] Gemini helped map the fog's reveal value to the opacity 
    // of the celestial cycle for a smooth fade-out effect.
    let fogReveal = (typeof p1 !== 'undefined') ? p1.reveal : 0;
    let interactionFade = constrain(map(fogReveal, 0, 0.5, 1.0, 0.0), 0.0, 1.0);

    // Skip rendering entirely if fully faded out to save frame rate
    if (interactionFade <= 0.01) return; 

    blendMode(BLEND);
    this.part2.display(interactionFade);
  }
}

// =============================================================
// Core Mechanics: Part2 Class
// Handles the 20-second celestial loop, breathing animations, 
// and canvas boundary safety.
// =============================================================
class Part2 {
  constructor(w, h) {
    this.updateSize(w, h);
    this.loopDuration = 20000; // Full day/night cycle takes 20 seconds
  }

  updateSize(w, h) {
    this.w = w;
    this.h = h;
    
    // Set a massive celestial scale (22% of canvas width) for strong visual impact
    this.celestialSize = this.w * 0.22;  
    
    // Lower the center point to leave enough room for the top arch
    this.centerX = this.w / 2;
    this.centerY = this.h * 0.82; 
    
    // Calculate a dynamic safe radius based on canvas size.
    // [AI] Gemini assisted with this dynamic safe-radius calculation 
    // to ensure the celestial bodies and their flames never render outside the canvas.
    let padding = this.celestialSize * 0.85; 
    let maxRadiusX = this.w / 2 - padding; 
    let maxRadiusY = this.centerY - padding; 
    
    // Take the minimum value to guarantee safety on both axes
    this.radius = Math.min(maxRadiusX, maxRadiusY); 
    
    // Off-screen buffer for the seamless moon phase mask
    if (this.moonBuffer) {
      this.moonBuffer.remove();
    }
    this.moonBuffer = createGraphics(Math.floor(this.celestialSize + 40), Math.floor(this.celestialSize + 40));
  }

  display(fade = 1.0) {
    push();
    let timeProgress = (millis() % this.loopDuration) / this.loopDuration;

    // Map the 0-1 progress to separate rising and setting phases for both sun and moon
    let sunProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 0, 1) : map(timeProgress, 0.5, 1.0, 1, 0);
    let moonProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 1, 0) : map(timeProgress, 0.5, 1.0, 0, 1);
    
    let isSunRising = timeProgress < 0.5;
    let isMoonRising = timeProgress >= 0.5;

    this.drawMoon(moonProgress, isMoonRising, fade);
    this.drawSun(sunProgress, isSunRising, fade);
    pop();
  }

  // ================= Particle Sparks System =================
  drawSparks(progress, startAngle, endAngle, isSun, fade) {
    drawingContext.shadowBlur = 15; 
    drawingContext.shadowColor = isSun ? color(255, 100, 20, 255 * fade) : color(120, 180, 255, 255 * fade); 
    noStroke();
    
    let sparkCount = 45; 
    for(let i = 0; i < sparkCount; i++) {
      let sparkP = progress + (i * 0.015 * -1);
      if (sparkP > 0 && sparkP < 1) {
        let sa = map(sparkP, 0, 1, startAngle, endAngle);
        let sx = this.centerX + cos(sa) * this.radius;
        let sy = this.centerY - sin(sa) * this.radius;
        
        // Scatter particles randomly around the main body
        let randX = sin(i * 123.45) * (this.celestialSize * 0.45);
        let randY = cos(i * 678.90) * (this.celestialSize * 0.45);
        let sparkAlpha = map(i, 0, sparkCount, 255, 0) * progress * fade; 
        
        // Add a twinkling effect using time and index
        let twinkle = map(sin(millis() / 150 + i * 2), -1, 1, 0.2, 1);
        let sparkSize = map(sin(i * 77), -1, 1, 5, 15); 
        
        if (isSun) {
          fill(255, i % 3 === 0 ? 200 : 80, i % 3 === 0 ? 150 : 20, sparkAlpha * twinkle);
        } else {
          fill(i % 3 === 0 ? 255 : 150, i % 3 === 0 ? 255 : 220, 255, sparkAlpha * twinkle);
        }
        circle(sx + randX, sy + randY + sin(millis() / 300 - i) * 12, sparkSize); 
      }
    }
  }

  // ================= Sun Module =================
  drawSun(progress, isRising, fade) {
    push();
    let angle = map(progress, 0, 1, 0, HALF_PI - 0.15); 
    let sunX = this.centerX + cos(angle) * this.radius;
    let sunY = this.centerY - sin(angle) * this.radius; 
    
    // Only draw sparks as the sun is rising
    if (isRising) this.drawSparks(progress, 0, HALF_PI - 0.15, true, fade);

    translate(sunX, sunY);
    let currentAlpha = map(progress, 0, 1, 40, 255) * fade; 
    
    // Add a subtle 4% heartbeat scaling effect
    let breathScale = 1 + sin(millis() / 800) * 0.04; 
    scale(breathScale); 
    
    // [REF] HTML5 Canvas shadowBlur: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur
    // Used drawingContext to create a native, soft glowing halo behind the sun.
    drawingContext.shadowBlur = 35; 
    drawingContext.shadowColor = color(255, 60, 10, currentAlpha); 
    
    // Draw the aggressive double-layered flames
    push();
    rotate(millis() / 2000); // Slow constant rotation
    let numRays = 24; 
    
    // Push the inner radius deep inside to prevent black gap artifacts
    let innerR = this.celestialSize * 0.1; 
    let baseOuterR = this.celestialSize * 0.85; 
    
    drawingContext.shadowBlur = 10;
    noStroke(); // Crucial: removes outlines to keep the flames perfectly clean
    let time = millis() / 500; 
    
    for (let i = 0; i < numRays; i++) {
      let a = map(i, 0, numRays, 0, TWO_PI);
      push();
      rotate(a);
      
      // Calculate dynamic swaying and stretching for the flame tips
      let wave = sin(i * 2 + time); 
      let dynOuterR = baseOuterR + wave * 15; 
      let sway = cos(i * 3 + time * 1.5) * 18; 
      
      for(let j = 2; j > 0; j--) {
        if(j === 2) {
          fill(255, 120, 20, currentAlpha * 0.35); // Outer flame
        } else {
          fill(255, 180, 50, currentAlpha * 0.7);  // Inner bright flame
        }
        let curOuter = dynOuterR * (j === 2 ? 1 : 0.75);
        let curSway = sway * (j === 2 ? 1 : 0.6);
        let widthFactor = 7 * j; 

        // [REF] Bezier Curves: https://p5js.org/reference/p5/bezierVertex/
        // Used to mathematically generate the curved, swaying tips of the flames without static images.
        beginShape();
        vertex(innerR * 0.9, widthFactor);
        bezierVertex(
          this.celestialSize * 0.4, widthFactor * 1.5, 
          curOuter * 0.5, 15 + curSway, 
          curOuter, curSway
        );
        bezierVertex(
          curOuter * 0.5, -5 + curSway, 
          this.celestialSize * 0.4, -widthFactor * 1.5, 
          innerR * 0.9, -widthFactor
        );
        endShape(CLOSE);
      }
      pop();
    }
    pop();
    drawingContext.shadowBlur = 0; 

    // Draw the solid sun disk over the flame roots for seamless blending
    noStroke();
    for (let i = 5; i > 0; i--) {
      let rRatio = i / 5;
      let rCol = lerpColor(color(215, 40, 20, currentAlpha * 0.8), color(255, 230, 150, currentAlpha), 1 - rRatio);
      fill(rCol);
      circle(0, 0, this.celestialSize * rRatio);
    }

    // Blend the Golden Crow (Jinwu) image
    let birdAlpha = (progress > 0.5 ? map(progress, 0.6, 0.9, 0, 255, true) : 0) * fade;
    if (birdAlpha > 5) {
      push();
      blendMode(MULTIPLY); 
      tint(255, birdAlpha); 
      image(jinwuImg, 0, 0, this.celestialSize * 0.65, this.celestialSize * 0.65); 
      pop(); 
    }
    
    pop(); 
  }

  // ================= Moon Module =================
  drawMoon(progress, isRising, fade) {
    push();
    let angle = map(progress, 0, 1, PI, HALF_PI + 0.15); 
    let moonX = this.centerX + cos(angle) * this.radius;
    let moonY = this.centerY - sin(angle) * this.radius;
    
    if (isRising) this.drawSparks(progress, PI, HALF_PI + 0.15, false, fade);

    let currentAlpha = map(progress, 0, 1, 40, 255) * fade; 
    translate(moonX, moonY);
    
    // Moon heartbeat breathing effect
    let breathScale = 1 + sin(millis() / 800) * 0.04; 
    scale(breathScale); 

    // Base glowing halo for the moon (kept pure and soft, no sharp rays)
    drawingContext.shadowBlur = 40; 
    drawingContext.shadowColor = color(150, 200, 255, currentAlpha); 
    noStroke();
    fill(180, 220, 255, currentAlpha * 0.1); 
    circle(0, 0, this.celestialSize * 1.2);
    drawingContext.shadowBlur = 0; 
    
    // Off-screen masking trick to create a flawless moon phase transition
    let pg = this.moonBuffer;
    let pgCenter = pg.width / 2;
    pg.clear(); 
    
    pg.noStroke();
    for (let i = 5; i > 0; i--) {
      let rRatio = i / 5;
      let mCol = lerpColor(color(255, 230, 150, currentAlpha * 0.7), color(250, 250, 255, currentAlpha), 1 - rRatio);
      pg.fill(mCol);
      pg.circle(pgCenter, pgCenter, this.celestialSize * rRatio);
    }

    pg.erase(); // Erase mode acts as a mask
    let maskStartX = this.celestialSize * 0.35; 
    let maskEndX = this.celestialSize * 1.3;
    let maskX = map(progress, 0, 1, maskStartX, maskEndX);
    pg.circle(pgCenter + maskX, pgCenter, this.celestialSize + 5); 
    pg.noErase(); 

    image(pg, 0, 0);

    // Blend the Jade Rabbit (Yutu) image
    let rabbitAlpha = (progress > 0.5 ? map(progress, 0.6, 0.9, 0, 255, true) : 0) * fade;
    if (rabbitAlpha > 5) {
      push();
      blendMode(MULTIPLY); 
      tint(255, rabbitAlpha);
      image(yutuImg, 0, 10, this.celestialSize * 0.65, this.celestialSize * 0.65);
      pop();
    }

    pop();
  }
}