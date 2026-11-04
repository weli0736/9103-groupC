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
    
    // 离屏缓冲层，专门用来“无痕抠月相”
    this.moonBuffer = createGraphics(this.celestialSize + 20, this.celestialSize + 20);
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
      this.drawSparks(progress, 0, HALF_PI - 0.2, true);
    }

    translate(sunX, sunY);
    let currentAlpha = map(progress, 0, 1, 60, 255);
    
    // 太阳本体发光效果
    let glowSize = map(sin(millis() / 200), -1, 1, 30, 100); 
    drawingContext.shadowBlur = glowSize;
    drawingContext.shadowColor = color(255, 60, 10, currentAlpha); 
    
    // 【回退优化版】：同向旋转、虚幻、大幅度摇晃的火焰
    push();
    rotate(millis() / 2000); // 整体缓缓自转
    let numRays = 30; // 密集火环
    let innerR = this.celestialSize * 0.42;
    let baseOuterR = this.celestialSize * 0.75;
    
    // 火焰全局柔光散色
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(255, 100, 0, currentAlpha);
    noStroke();
    
    let time = millis() / 500; 
    
    for (let i = 0; i < numRays; i++) {
      let a = map(i, 0, numRays, 0, TWO_PI);
      push();
      rotate(a);
      
      let wave = sin(i * 2 + time); 
      let dynOuterR = baseOuterR + wave * 15; // 长度呼吸伸缩
      let sway = cos(i * 3 + time * 1.5) * 20; // 尖端左右摇曳偏移
      
      // 两层火焰完全绑定在一起，内亮外透
      for(let j = 2; j > 0; j--) {
        if(j === 2) {
          fill(255, 120, 20, currentAlpha * 0.25); // 外层透明
        } else {
          fill(255, 180, 50, currentAlpha * 0.6);  // 内层微亮
        }
        
        let curOuter = dynOuterR * (j === 2 ? 1 : 0.75);
        let curSway = sway * (j === 2 ? 1 : 0.6);
        let widthFactor = 6 * j; 

        beginShape();
        vertex(innerR * 0.9, widthFactor);
        // 微调了这里的控制点，让尖端看起来不那么像一根锐利的针
        bezierVertex(
          innerR * 1.1, widthFactor * 1.5, 
          curOuter * 0.5, 15 + curSway, 
          curOuter, curSway
        );
        bezierVertex(
          curOuter * 0.5, -5 + curSway, 
          innerR * 1.1, -widthFactor * 1.5, 
          innerR * 0.9, -widthFactor
        );
        endShape(CLOSE);
      }
      pop();
    }
    pop();
    drawingContext.shadowBlur = 0; 

    // 红橙渐变圆盘本体
    noStroke();
    for (let i = 5; i > 0; i--) {
      let rRatio = i / 5;
      let rCol = lerpColor(color(215, 40, 20, currentAlpha), color(255, 180, 50, currentAlpha), 1 - rRatio);
      fill(rCol);
      circle(0, 0, this.celestialSize * rRatio);
    }

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
      this.drawSparks(progress, PI, HALF_PI + 0.2, false);
    }

    let currentAlpha = map(progress, 0, 1, 60, 255);
    translate(moonX, moonY);
    
    // 离屏无痕遮罩抠月相
    let pg = this.moonBuffer;
    let pgCenter = pg.width / 2;
    pg.clear(); 
    
    pg.noStroke();
    for (let i = 5; i > 0; i--) {
      let rRatio = i / 5;
      let mCol = lerpColor(color(255, 230, 150, currentAlpha), color(250, 250, 255, currentAlpha), 1 - rRatio);
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
    let rabbitAlpha = progress > 0.5 ? map(progress, 0.6, 0.9, 0, 255, true) : 0;
    push();
    blendMode(MULTIPLY); 
    tint(255, rabbitAlpha);
    image(yutuImg, 0, 10, this.celestialSize * 0.65, this.celestialSize * 0.65);
    pop();

    pop();
  }
}