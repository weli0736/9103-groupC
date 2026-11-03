// 全局变量
let part2Mechanic;
let yutuImg, jinwuImg;

// =========================================
// 1. 预加载图片资源
// =========================================
function preload() {
  yutuImg = loadImage('yutu1.png');
  jinwuImg = loadImage('jinwu1.png');
}

function setup() {
  createCanvas(1000, 600); 
  noStroke();
  imageMode(CENTER); 
  part2Mechanic = new Part2(width, height);
}

function draw() {
  blendMode(BLEND);
  background(40, 32, 28); 
  part2Mechanic.display();
}

// =========================================
// 核心架构：Class Part2 
// =========================================
class Part2 {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.loopDuration = 20000; // 20秒循环
    
    this.celestialSize = 240;  
    this.centerY = this.h - this.celestialSize / 2 - 10; 
    this.centerX = this.w / 2;
    this.radius = 310; 
  }

  display() {
    let timeProgress = (millis() % this.loopDuration) / this.loopDuration;

    let sunProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 0, 1) : map(timeProgress, 0.5, 1.0, 1, 0);
    let moonProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 1, 0) : map(timeProgress, 0.5, 1.0, 0, 1);
    
    let isSunRising = timeProgress < 0.5;
    let isMoonRising = timeProgress >= 0.5;

    this.drawMoon(moonProgress, isMoonRising);
    this.drawSun(sunProgress, isSunRising);
  }

  // ================= 提取出的公共方法：星火粒子特效 =================
  drawSparks(progress, startAngle, endAngle, isSun) {
    drawingContext.shadowBlur = 35;
    drawingContext.shadowColor = isSun ? color(255, 80, 20) : color(120, 180, 255); 
    noStroke();
    
    let sparkCount = 60; 
    for(let i = 0; i < sparkCount; i++) {
      let sparkP = progress + (i * 0.012 * -1);
      if (sparkP > 0 && sparkP < 1) {
        let sa = map(sparkP, 0, 1, startAngle, endAngle);
        let sx = this.centerX + cos(sa) * this.radius;
        let sy = this.centerY - sin(sa) * this.radius;
        let randX = sin(i * 123.45) * 65;
        let randY = cos(i * 678.90) * 65;
        let sparkAlpha = map(i, 0, sparkCount, 255, 0) * progress;
        let twinkle = map(sin(millis() / 150 + i * 2), -1, 1, 0.2, 1);
        let sparkSize = map(sin(i * 77), -1, 1, 4, 15); 
        
        if (isSun) {
          fill(255, i % 3 === 0 ? 200 : 80, i % 3 === 0 ? 150 : 20, sparkAlpha * twinkle);
        } else {
          fill(i % 3 === 0 ? 255 : 150, i % 3 === 0 ? 255 : 220, 255, sparkAlpha * twinkle);
        }
        circle(sx + randX, sy + randY + sin(millis() / 300 - i) * 15, sparkSize); 
      }
    }
  }

  // ================= 太阳核心模块 =================
  drawSun(progress, isRising) {
    push();
    
    let angle = map(progress, 0, 1, 0, HALF_PI - 0.2); 
    let sunX = this.centerX + cos(angle) * this.radius;
    let sunY = this.centerY - sin(angle) * this.radius; 
    
    if (isRising) {
      // 直接调用公共特效函数，代码大幅精简
      this.drawSparks(progress, 0, HALF_PI - 0.2, true);
    }

    translate(sunX, sunY);
    let currentAlpha = map(progress, 0, 1, 60, 255);
    
    // 神话纹样自转
    push();
    rotate(millis() / 1500); 
    let patternAlpha = map(progress, 0, 1, 0, 200); 
    stroke(255, 180, 50, patternAlpha);
    strokeWeight(4);
    noFill();
    for(let i = 0; i < 8; i++) {
      rotate(TWO_PI / 8); 
      arc(135, 0, 25, 25, 0, PI);
      circle(155, 0, 5);
    }
    pop();

    // 太阳本体
    let glowSize = map(sin(millis() / 200), -1, 1, 30, 100); 
    drawingContext.shadowBlur = glowSize;
    drawingContext.shadowColor = color(255, 60, 10, currentAlpha); 
    noStroke();
    fill(215, 60, 30, currentAlpha); 
    circle(0, 0, this.celestialSize);

    // 金乌显现
    drawingContext.shadowBlur = 0; 
    let birdAlpha = progress > 0.5 ? map(progress, 0.6, 0.9, 0, 255, true) : 0;
    
    push();
    blendMode(MULTIPLY); 
    tint(255, birdAlpha); 
    image(jinwuImg, 0, 0, this.celestialSize * 0.65, this.celestialSize * 0.65); 
    pop(); 
    
    pop(); 
  }

  // ================= 月亮核心模块 =================
  drawMoon(progress, isRising) {
    push();
    
    let angle = map(progress, 0, 1, PI, HALF_PI + 0.2); 
    let moonX = this.centerX + cos(angle) * this.radius;
    let moonY = this.centerY - sin(angle) * this.radius;
    
    if (isRising) {
      // 直接调用公共特效函数，代码大幅精简
      this.drawSparks(progress, PI, HALF_PI + 0.2, false);
    }

    let currentAlpha = map(progress, 0, 1, 60, 255);
    drawingContext.shadowBlur = 0; 
    translate(moonX, moonY);
    
    // 月亮本体
    fill(230, 240, 255, currentAlpha);
    circle(0, 0, this.celestialSize);

    // 玉兔显现
    let rabbitAlpha = progress > 0.5 ? map(progress, 0.6, 0.9, 0, 255, true) : 0;
    push();
    blendMode(MULTIPLY); 
    tint(255, rabbitAlpha);
    image(yutuImg, 0, 10, this.celestialSize * 0.65, this.celestialSize * 0.65);
    pop();

    // 月相遮罩
    let maskStartX = this.celestialSize * 0.35; 
    let maskEndX = this.celestialSize * 1.3;
    let maskX = map(progress, 0, 1, maskStartX, maskEndX);
    
    blendMode(BLEND);
    fill(40, 32, 28); 
    circle(maskX, 0, this.celestialSize + 5); 
    
    pop();
  }
}