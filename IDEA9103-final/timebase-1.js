// =============================================================
// timebase-1.js · Haocheng Gong · Sun & Moon Cycle (Clean, Large, Safe Bounds)
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
    // 联动迷雾消散 (当 Kristen 迷雾推开时，日月跟随淡出)
    let fogReveal = (typeof p1 !== 'undefined') ? p1.reveal : 0;
    let interactionFade = constrain(map(fogReveal, 0, 0.5, 1.0, 0.0), 0.0, 1.0);

    if (interactionFade <= 0.01) return; // 隐去时不渲染，保证流畅度

    blendMode(BLEND);
    this.part2.display(interactionFade);
  }
}

// =============================================================
// 核心架构：Class Part2 (极大化、无黑线、月亮纯净无光芒、绝对安全)
// =============================================================
class Part2 {
  constructor(w, h) {
    this.updateSize(w, h);
    this.loopDuration = 20000; // 20秒循环
  }

  updateSize(w, h) {
    this.w = w;
    this.h = h;
    
    // 【极大化尺寸】：本体占比 22%
    this.celestialSize = this.w * 0.22;  
    
    // 【位置下移】：给上方的火焰留出空间
    this.centerX = this.w / 2;
    this.centerY = this.h * 0.82; 
    
    // 【绝对安全半径计算】：预留0.85倍的本体大小作为边距，确保火焰绝不出界
    let padding = this.celestialSize * 0.85; 
    let maxRadiusX = this.w / 2 - padding; 
    let maxRadiusY = this.centerY - padding; 
    this.radius = Math.min(maxRadiusX, maxRadiusY); 
    
    if (this.moonBuffer) {
      this.moonBuffer.remove();
    }
    this.moonBuffer = createGraphics(Math.floor(this.celestialSize + 40), Math.floor(this.celestialSize + 40));
  }

  display(fade = 1.0) {
    push();
    let timeProgress = (millis() % this.loopDuration) / this.loopDuration;

    let sunProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 0, 1) : map(timeProgress, 0.5, 1.0, 1, 0);
    let moonProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 1, 0) : map(timeProgress, 0.5, 1.0, 0, 1);
    
    let isSunRising = timeProgress < 0.5;
    let isMoonRising = timeProgress >= 0.5;

    this.drawMoon(moonProgress, isMoonRising, fade);
    this.drawSun(sunProgress, isSunRising, fade);
    pop();
  }

  // ================= 星火粒子特效 =================
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
        let randX = sin(i * 123.45) * (this.celestialSize * 0.45);
        let randY = cos(i * 678.90) * (this.celestialSize * 0.45);
        let sparkAlpha = map(i, 0, sparkCount, 255, 0) * progress * fade; 
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

  // ================= 太阳核心模块（纯净火焰、无黑线缝隙） =================
  drawSun(progress, isRising, fade) {
    push();
    let angle = map(progress, 0, 1, 0, HALF_PI - 0.15); 
    let sunX = this.centerX + cos(angle) * this.radius;
    let sunY = this.centerY - sin(angle) * this.radius; 
    
    if (isRising) this.drawSparks(progress, 0, HALF_PI - 0.15, true, fade);

    translate(sunX, sunY);
    let currentAlpha = map(progress, 0, 1, 40, 255) * fade; 
    
    // 呼吸特效：放大缩小 4%
    let breathScale = 1 + sin(millis() / 800) * 0.04; 
    scale(breathScale); 
    
    // 太阳本体全局发光
    drawingContext.shadowBlur = 35; 
    drawingContext.shadowColor = color(255, 60, 10, currentAlpha); 
    
    // 双层张扬火焰
    push();
    rotate(millis() / 2000); 
    let numRays = 24; 
    // 【关键修复】：把火焰的内部半径(innerR)压进极深的核心，防止和外围圆盘产生缝隙漏出“黑线”底色
    let innerR = this.celestialSize * 0.1; 
    let baseOuterR = this.celestialSize * 0.85; 
    
    drawingContext.shadowBlur = 10;
    noStroke(); // 强制无描边，杜绝任何黑线
    let time = millis() / 500; 
    
    for (let i = 0; i < numRays; i++) {
      let a = map(i, 0, numRays, 0, TWO_PI);
      push();
      rotate(a);
      
      let wave = sin(i * 2 + time); 
      let dynOuterR = baseOuterR + wave * 15; 
      let sway = cos(i * 3 + time * 1.5) * 18; 
      
      for(let j = 2; j > 0; j--) {
        if(j === 2) {
          fill(255, 120, 20, currentAlpha * 0.35); // 外焰
        } else {
          fill(255, 180, 50, currentAlpha * 0.7);  // 内焰
        }
        let curOuter = dynOuterR * (j === 2 ? 1 : 0.75);
        let curSway = sway * (j === 2 ? 1 : 0.6);
        let widthFactor = 7 * j; 

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

    // 太阳渐变圆盘本体 (覆盖在火焰根部之上，完美融合)
    noStroke();
    for (let i = 5; i > 0; i--) {
      let rRatio = i / 5;
      let rCol = lerpColor(color(215, 40, 20, currentAlpha * 0.8), color(255, 230, 150, currentAlpha), 1 - rRatio);
      fill(rCol);
      circle(0, 0, this.celestialSize * rRatio);
    }

    // 金乌显现
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

  // ================= 月亮核心模块（无射线光芒，纯净版） =================
  drawMoon(progress, isRising, fade) {
    push();
    let angle = map(progress, 0, 1, PI, HALF_PI + 0.15); 
    let moonX = this.centerX + cos(angle) * this.radius;
    let moonY = this.centerY - sin(angle) * this.radius;
    
    if (isRising) this.drawSparks(progress, PI, HALF_PI + 0.15, false, fade);

    let currentAlpha = map(progress, 0, 1, 40, 255) * fade; 
    translate(moonX, moonY);
    
    // 月亮呼吸特效
    let breathScale = 1 + sin(millis() / 800) * 0.04; 
    scale(breathScale); 

    // 月亮底背发光 (纯净版：完全没有任何冰芒射线，只有光晕)
    drawingContext.shadowBlur = 40; 
    drawingContext.shadowColor = color(150, 200, 255, currentAlpha); 
    noStroke();
    fill(180, 220, 255, currentAlpha * 0.1); 
    circle(0, 0, this.celestialSize * 1.2);
    drawingContext.shadowBlur = 0; 
    
    // 离屏无痕遮罩抠月相
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

    pg.erase(); 
    let maskStartX = this.celestialSize * 0.35; 
    let maskEndX = this.celestialSize * 1.3;
    let maskX = map(progress, 0, 1, maskStartX, maskEndX);
    pg.circle(pgCenter + maskX, pgCenter, this.celestialSize + 5); 
    pg.noErase(); 

    image(pg, 0, 0);

    // 玉兔显现
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