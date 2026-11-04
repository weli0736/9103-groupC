// =============================================================
// timebase-2.js · Haocheng Gong · Background Artwork (Harmonious & Noticeable Glows)
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
    // 1. 渲染 bg2.png 前景底图元素
    push();
    tint(210); 
    imageMode(CORNER);
    image(bgElements, 0, 0, this.w, this.h);
    pop();

    imageMode(CENTER);

    // 10 秒时间轴循环
    let cycleDuration = 10000; 
    let cycleProgress = (millis() % cycleDuration) / cycleDuration;

    let moonIntensity = cycleProgress < 0.5 ? sin(map(cycleProgress, 0, 0.5, 0, 1) * PI) : 0;
    let sunIntensity = cycleProgress >= 0.5 ? sin(map(cycleProgress, 0.5, 1.0, 0, 1) * PI) : 0;
    let bellIntensity = moonIntensity + sunIntensity;

    // 2. 渲染月树果实脉冲
    if (moonIntensity > 0.01) this.drawMoonSystem(moonIntensity);
    // 3. 渲染扶桑树果实脉冲
    if (sunIntensity > 0.01) this.drawSunSystem(sunIntensity);
    // 4. 渲染青铜钟黄光与呼吸
    if (bellIntensity > 0.01) this.drawBellHaloGlow(bellIntensity);
    // 5. 渲染 10 秒海浪流动 (保留原汁原味的工笔细线)
    this.drawStylizedWaves(cycleProgress);
  }

  // ================= 月树果实系统 =================
  drawMoonSystem(intensity) {
    push();
    blendMode(ADD); // 保持 ADD 模式，打造神话发光感
    // 光晕范围略微扩大，让效果更明显
    this.drawBigGlow(this.w * 0.115, this.h * 0.16, this.w * 0.28, 200, 230, 255, intensity);
    let r = this.w * 0.11; // 小果实光晕也等比放大
    this.drawBigGlow(this.w * 0.285, this.h * 0.115, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.355, this.h * 0.155, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.130, this.h * 0.350, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.050, this.h * 0.430, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.185, this.h * 0.480, r, 200, 230, 255, intensity);
    this.drawBigGlow(this.w * 0.245, this.h * 0.550, r, 200, 230, 255, intensity);
    pop();
  }

  // ================= 扶桑树果实系统 =================
  drawSunSystem(intensity) {
    push();
    blendMode(ADD);
    this.drawBigGlow(this.w * 0.905, this.h * 0.145, this.w * 0.28, 255, 60, 20, intensity);
    let r = this.w * 0.11; 
    this.drawBigGlow(this.w * 0.725, this.h * 0.105, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.655, this.h * 0.175, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.695, this.h * 0.280, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.825, this.h * 0.275, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.935, this.h * 0.380, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.785, this.h * 0.525, r, 255, 60, 20, intensity);
    this.drawBigGlow(this.w * 0.855, this.h * 0.575, r, 255, 60, 20, intensity);
    pop();
  }

  // ================= 优化版果实发光算法 =================
  drawBigGlow(x, y, maxRadius, r, g, b, intensity) {
    noStroke();
    let layers = 6; // 增加层数，渐变更柔和
    let step = maxRadius / layers;
    
    // 1. 柔和的大范围外围光晕 (调低了 Alpha 最大值防刺眼)
    for (let i = maxRadius; i > 0; i -= step) {
      let progress = 1 - (i / maxRadius);
      // pow(progress, 1.2) 让光晕衰减变缓，光感更强但更和谐
      let alpha = pow(progress, 1.2) * 60 * intensity; 
      fill(r, g, b, alpha);
      ellipse(x, y, i, i);
    }
    
    // 2. 【新增】果实的高光核心点，让果实在任何时候都非常明显且精致
    fill(255, 255, 255, 180 * intensity);
    let coreRadius = maxRadius * 0.15;
    ellipse(x, y, coreRadius, coreRadius);
  }

  // ================= 优化版青铜钟呼吸光效 =================
  drawBellHaloGlow(intensity) {
    push();
    blendMode(ADD);
    let bellX = this.w * 0.5;
    let bellY = this.h * 0.15;
    
    // 1. 【新增】钟体中心的柔和光晕，让钟本体看起来也在发光
    noStroke();
    fill(255, 200, 80, 50 * intensity);
    ellipse(bellX, bellY, this.w * 0.08, this.w * 0.06);

    // 2. 外部扩散的能量光环（加粗并扩大范围）
    noFill();
    let innerDiameter = this.w * 0.05;
    let outerDiameter = this.w * 0.22; // 圈扩展得更大，更明显
    let layers = 12;
    let step = (outerDiameter - innerDiameter) / layers;
    
    for (let i = 0; i < layers; i++) {
      let d = innerDiameter + i * step;
      let progress = i / (layers - 1);
      // 增强单圈的最大透明度 (从25提升到45)，让光环更清晰和谐
      let alpha = sin(progress * PI) * 45 * intensity; 
      stroke(255, 220, 100, alpha);
      strokeWeight(step * 1.8); // 增厚光环线条厚度，存在感更强
      ellipse(bellX, bellY, d, d * 0.75);
    }
    pop();
  }

  // ================= 工笔海浪模块 =================
  drawStylizedWaves(cycle) {
    push();
    let phase = cycle * TWO_PI;
    let waveColors = [
      color(68, 55, 45, 200), color(105, 125, 105, 230),
      color(150, 125, 90, 240), color(140, 75, 55, 255)
    ];
    for (let i = 0; i < 4; i++) {
      let yBase = this.h - (4 - i) * (this.h * 0.04);
      let amp = this.h * 0.04 + i * 2;
      let freq = 0.012 - i * 0.001;
      let dir = (i % 2 === 0) ? 1 : -1;

      // 海浪主体
      fill(waveColors[i]);
      stroke(25, 20, 15);
      strokeWeight(3.5);
      beginShape();
      vertex(0, this.h);
      for (let x = 0; x <= this.w; x += 20) {
        let yOffset = sin(x * freq + phase * dir + i * 2) * amp;
        let yOffset2 = cos(x * freq * 1.5 - phase * dir) * (amp * 0.3);
        vertex(x, yBase + yOffset + yOffset2);
      }
      vertex(this.w, this.h);
      endShape(CLOSE);

      // 海浪内部工笔横线
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