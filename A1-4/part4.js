class TimeSunMoon {
  constructor() {}

  display() {
    push();
    // 获取运行时间（毫秒）
    let t = millis() * 0.001; 
    
    // 利用 sin 函数做一个平滑的上下浮动和大小呼吸效果
    let pulse = sin(t) * 10;
    
    // 左上角：金乌（太阳）- 红色
    fill(200, 50, 30);
    noStroke();
    ellipse(width * 0.2, height * 0.15 + pulse, 60 + pulse, 60 + pulse);
    
    // 右上角：玉兔（月亮）- 银白色
    fill(220, 220, 200);
    ellipse(width * 0.8, height * 0.15 - pulse, 50 - pulse, 50 - pulse);
    pop();
  }
}