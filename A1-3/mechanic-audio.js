class AudioDragons {
  constructor() {
    // 设置麦克风输入
    this.mic = new p5.AudioIn();
    this.mic.start();
  }

  display() {
    push();
    // 获取当前音量大小 (0.0 到 1.0)
    let vol = this.mic.getLevel();
    
    // 映射音量到图形大小 (基础大小50，最大200)
    let dragonSize = map(vol, 0, 1, 50, 200);
    
    translate(width / 2, height / 2); // 移到画面中间（人间/地下交界）
    
    // 用两个旋转的几何图形抽象代表双龙交织
    noFill();
    strokeWeight(3);
    
    // 左青龙抽象
    stroke(50, 150, 100, 200);
    rotate(frameCount * 0.02);
    ellipse(-50, 0, dragonSize, dragonSize * 2);
    
    // 右白/金龙抽象
    stroke(200, 180, 50, 200);
    rotate(-frameCount * 0.04);
    ellipse(50, 0, dragonSize, dragonSize * 2);
    pop();
  }
}