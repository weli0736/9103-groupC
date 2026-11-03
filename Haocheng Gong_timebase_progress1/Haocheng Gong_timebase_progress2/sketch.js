// 全局变量
let part2Mechanic;
let yutuImg, jinwuImg, chanchuImg, tianeImg, shenxianImg, fusangImg;

// =========================================
// 1. 预加载所有图片资源
// =========================================
function preload() {
  yutuImg = loadImage('yutu1.png');
  jinwuImg = loadImage('jinwu1.png');
  chanchuImg = loadImage('chanchu1.png');   
  tianeImg = loadImage('tiane1.png');       
  shenxianImg = loadImage('shenxian1.png'); 
  fusangImg = loadImage('fusang1.png');      
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
    
    // 【时间引擎重构】：恢复为连续不断的平滑 20 秒循环
    this.loopDuration = 20000; 
    
    this.celestialSize = 240;  
    this.centerY = this.h - this.celestialSize / 2 - 10; 
    this.centerX = this.w / 2;
    this.radius = 310; 
    
    this.clouds = [
      { type: 1, x: 120, y: 120, scale: 1.8 }, 
      { type: 2, x: 860, y: 100, scale: 1.8 }, 
      { type: 3, x: 150, y: 320, scale: 1.6 }, 
      { type: 4, x: 580, y: 440, scale: 1.9 }  
    ];
  }

  display() {
    let timeProgress = (millis() % this.loopDuration) / this.loopDuration;

    // 太阳和月亮的 progress 永远在 0 到 1 之间丝滑过渡
    let sunProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 0, 1) : map(timeProgress, 0.5, 1.0, 1, 0);
    let moonProgress = timeProgress < 0.5 ? map(timeProgress, 0, 0.5, 1, 0) : map(timeProgress, 0.5, 1.0, 0, 1);
    
    let isSunRising = timeProgress < 0.5;
    let isMoonRising = timeProgress >= 0.5;

    // ====================================================
    // 1. 最底层：画月亮与遮罩
    // ====================================================
    this.drawMoon(moonProgress, isMoonRising);

    // ====================================================
    // 2. 中间层：背景图腾 (平滑淡入淡出引擎)
    // ====================================================
    // 只有当月亮相位过半时，月亮生态（祥云、蟾蜍、天鹅）才会逐渐显现
    if (moonProgress > 0.5) {
      let alpha = map(moonProgress, 0.5, 1.0, 0, 255);
      
      this.renderMoonClouds(alpha);
      
      push();
      tint(255, alpha); 
      image(chanchuImg, 750, 220, 260, 260); 
      image(tianeImg, 220, 480, 280, 210); 
      pop();
    }
    
    // 只有当太阳相位过半时，太阳生态（扶桑、神仙）才会逐渐显现
    if (sunProgress > 0.5) {
      let alpha = map(sunProgress, 0.5, 1.0, 0, 255);
      
      push();
      tint(255, alpha);
      
      push();
      translate(450, 600); 
      rotate(radians(-35)); 
      image(fusangImg, 0, -260, 360, 500); 
      pop();
      
      image(shenxianImg, 820, 450, 260, 260); 
      pop();
    }

    // ====================================================
    // 3. 最顶层：画太阳
    // ====================================================
    this.drawSun(sunProgress, isSunRising);
  }

  // ================= 祥云绘制模块 =================
  renderMoonClouds(alpha) {
    push();
    for (let i = 0; i < this.clouds.length; i++) {
      let c = this.clouds[i];
      this.drawVectorCloud(c.type, c.x, c.y, c.scale, alpha);
    }
    pop();
  }

  drawVectorCloud(type, x, y, s, alpha) {
    push();
    translate(x, y);
    scale(s);
    
    noStroke();
    fill(70, 90, 120, alpha * 0.8); 
    
    if (type === 1) {
      ellipse(0, 0, 50, 40); ellipse(-15, 5, 30, 30); ellipse(20, 8, 60, 25); 
    } else if (type === 2) {
      ellipse(0, 0, 55, 40); ellipse(-15, -5, 35, 30); ellipse(15, -5, 35, 30);
    } else if (type === 3) {
      ellipse(0, 0, 70, 25); ellipse(-20, -3, 40, 20); ellipse(20, 3, 40, 20);
    } else if (type === 4) {
      ellipse(0, -5, 60, 50); ellipse(-20, 5, 40, 30); ellipse(20, 5, 40, 30);
    }

    stroke(180, 220, 255, alpha); 
    strokeWeight(2.5);
    noFill();
    strokeCap(ROUND);

    if (type === 1) { 
      arc(-5, -5, 25, 25, PI - 0.5, TWO_PI); arc(-15, 0, 20, 20, HALF_PI, PI + HALF_PI);
      bezier(-15, 10, 0, 10, 15, 20, 35, 8); arc(-5, -2, 10, 10, 0, PI + HALF_PI);
    } else if (type === 2) { 
      arc(-10, 0, 20, 20, PI, TWO_PI + HALF_PI); arc(10, 0, 15, 15, PI - HALF_PI, TWO_PI);
      arc(0, -10, 20, 20, PI, TWO_PI); arc(-3, 3, 8, 8, 0, PI);
    } else if (type === 3) { 
      bezier(-35, 5, -15, 0, -10, 10, 0, 5); bezier(0, 5, 15, 0, 20, 10, 35, 2);
      arc(0, -3, 20, 20, PI, TWO_PI); arc(0, 0, 6, 6, -PI, HALF_PI);
    } else if (type === 4) { 
      arc(-15, -5, 25, 25, PI - 1, TWO_PI); arc(15, -5, 25, 25, PI, TWO_PI + 1);
      arc(0, -15, 30, 30, PI, TWO_PI); bezier(-25, 5, -10, 15, 10, 15, 25, 5);
      arc(-5, 0, 10, 10, 0, PI + HALF_PI); arc(10, 0, 8, 8, PI, TWO_PI + HALF_PI);
    }
    pop();
  }

  // ================= 太阳与金乌模块 =================
  drawSun(progress, isRising) {
    push();
    blendMode(BLEND); 
    let angle = map(progress, 0, 1, 0, HALF_PI - 0.2); 
    let sunX = this.centerX + cos(angle) * this.radius;
    let sunY = this.centerY - sin(angle) * this.radius; 
    
    if (isRising) {
      drawingContext.shadowBlur = 35;
      drawingContext.shadowColor = color(255, 80, 20); 
      noStroke();
      let sparkCount = 60; 
      for(let i = 0; i < sparkCount; i++) {
        let sparkP = progress + (i * 0.012 * -1);
        if (sparkP > 0 && sparkP < 1) {
          let sa = map(sparkP, 0, 1, 0, HALF_PI - 0.2);
          let sx = this.centerX + cos(sa) * this.radius;
          let sy = this.centerY - sin(sa) * this.radius;
          let randX = sin(i * 123.45) * 65;
          let randY = cos(i * 678.90) * 65;
          let sparkAlpha = map(i, 0, sparkCount, 255, 0) * progress;
          let twinkle = map(sin(millis() / 150 + i * 2), -1, 1, 0.2, 1);
          let sparkSize = map(sin(i * 77), -1, 1, 4, 15); 
          let r = 255;
          let g = i % 3 === 0 ? 200 : 80;
          let b = i % 3 === 0 ? 150 : 20;
          fill(r, g, b, sparkAlpha * twinkle);
          circle(sx + randX, sy + randY + sin(millis() / 300 - i) * 15, sparkSize); 
        }
      }
    }

    translate(sunX, sunY);
    let currentAlpha = map(progress, 0, 1, 60, 255);
    
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

    let glowSize = map(sin(millis() / 200), -1, 1, 30, 100); 
    drawingContext.shadowBlur = glowSize;
    drawingContext.shadowColor = color(255, 60, 10, currentAlpha); 
    noStroke();
    fill(215, 60, 30, currentAlpha); 
    circle(0, 0, this.celestialSize);

    drawingContext.shadowBlur = 0; 
    let birdAlpha = progress > 0.6 ? map(progress, 0.6, 1, 0, 255) : 0;
    
    push();
    blendMode(MULTIPLY); 
    tint(255, birdAlpha); 
    image(jinwuImg, 0, 0, this.celestialSize * 0.65, this.celestialSize * 0.65); 
    pop(); 
    
    pop(); 
  }

  // ================= 月亮与玉兔模块 =================
  drawMoon(progress, isRising) {
    push();
    blendMode(BLEND); 
    let angle = map(progress, 0, 1, PI, HALF_PI + 0.2); 
    let moonX = this.centerX + cos(angle) * this.radius;
    let moonY = this.centerY - sin(angle) * this.radius;
    
    if (isRising) {
      drawingContext.shadowBlur = 35;
      drawingContext.shadowColor = color(120, 180, 255); 
      noStroke();
      let sparkCount = 60; 
      for(let i = 0; i < sparkCount; i++) {
        let sparkP = progress + (i * 0.012 * -1);
        if (sparkP > 0 && sparkP < 1) {
          let sa = map(sparkP, 0, 1, PI, HALF_PI + 0.2);
          let sx = this.centerX + cos(sa) * this.radius;
          let sy = this.centerY - sin(sa) * this.radius;
          let randX = sin(i * 123.45) * 65;
          let randY = cos(i * 678.90) * 65;
          let sparkAlpha = map(i, 0, sparkCount, 255, 0) * progress;
          let twinkle = map(sin(millis() / 150 + i * 2), -1, 1, 0.2, 1);
          let sparkSize = map(sin(i * 77), -1, 1, 4, 15); 
          let r = i % 3 === 0 ? 255 : 150;
          let g = i % 3 === 0 ? 255 : 220;
          let b = 255;
          fill(r, g, b, sparkAlpha * twinkle);
          circle(sx + randX, sy + randY + sin(millis() / 300 - i) * 15, sparkSize); 
        }
      }
    }

    let currentAlpha = map(progress, 0, 1, 60, 255);
    drawingContext.shadowBlur = 0; 
    translate(moonX, moonY);
    
    fill(230, 240, 255, currentAlpha);
    circle(0, 0, this.celestialSize);

    let rabbitAlpha = progress > 0.6 ? map(progress, 0.6, 1, 0, 255) : 0;
    
    push();
    blendMode(MULTIPLY); 
    tint(255, rabbitAlpha);
    image(yutuImg, 0, 10, this.celestialSize * 0.65, this.celestialSize * 0.65);
    pop();

    blendMode(BLEND);
    let maskStartX = this.celestialSize * 0.35; 
    let maskEndX = this.celestialSize * 1.3;
    let maskX = map(progress, 0, 1, maskStartX, maskEndX);
    
    fill(40, 32, 28); 
    circle(maskX, 0, this.celestialSize + 5); 
    
    pop();
  }
}