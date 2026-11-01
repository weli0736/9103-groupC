class InputLantern {
  constructor() {
    // 建一个数组，用来装鼠标移动时产生的“火花”粒子
    this.particles = []; 
  }

  display() {
    push();
    // 获取鼠标位置，如果鼠标还没动过，就放在画面中间
    let mx = mouseX || width / 2;
    let my = mouseY || height / 2;

    // 1. 交互状态切换：检测鼠标是否被按下
    let isClicking = mouseIsPressed;
    
    // 如果按下鼠标（进入冥界模式）：光晕变大，颜色变蓝
    // 如果没按鼠标（人间模式）：正常大小，颜色暖黄
    let maxRadius = isClicking ? 250 : 150;
    let coreColor = isClicking ? color(100, 200, 255, 150) : color(255, 250, 200, 150);
    let glowColor = isClicking ? color(50, 150, 255, 5) : color(255, 200, 100, 5);

    // 画提灯的光晕
    noStroke();
    for (let r = maxRadius; r > 0; r -= 10) {
      fill(glowColor);
      ellipse(mx, my, r, r);
    }
    
    // 画提灯的中心光源
    fill(coreColor);
    ellipse(mx, my, 10, 10);

    // 2. 交互拖尾：计算鼠标移动速度 (当前位置和上一帧位置的距离)
    let speed = dist(mouseX, mouseY, pmouseX, pmouseY);
    
    // 如果鼠标在移动，就往数组里添加新的粒子
    if (speed > 2) {
      this.particles.push({
        x: mx,
        y: my,
        vx: random(-1, 1), // 随机左右飘
        vy: random(-2, 0), // 慢慢向上飘
        life: 255,         // 粒子的初始生命值（透明度）
        c: isClicking ? color(100, 200, 255) : color(255, 200, 100) // 粒子颜色跟灯笼一致
      });
    }

    // 3. 更新并画出所有粒子
    // 倒着遍历数组（这是处理粒子消失时的标准好习惯，防止画面闪烁）
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      
      // 粒子移动
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 8; // 生命值慢慢减少（逐渐变透明）
      
      // 画出粒子
      fill(red(p.c), green(p.c), blue(p.c), p.life);
      ellipse(p.x, p.y, 4, 4);

      // 如果粒子完全透明了，就从数组里删掉它，节省电脑内存
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    pop();
  }
}