class NoiseClouds {
  constructor() {
    this.yOffset = 0;
  }

  display() {
    push();
    noStroke();
    // 只在画面上半部分（天界）画云
    for (let x = 0; x < width; x += 10) {
      for (let y = 0; y < height / 3; y += 10) {
        // 使用 noise 生成平滑的随机值
        let n = noise(x * 0.01, y * 0.01, this.yOffset);
        // 提取帛画的金色/暗红色调
        fill(200, 150, 50, n * 150); 
        ellipse(x, y, n * 20, n * 20);
      }
    }
    // 让云雾流动起来
    this.yOffset += 0.01;
    pop();
  }
}