const CLOUD_IMG_PATH = 'photo/cloud.png';


const CLOUD_OFFSET_Y = -150;
const CLOUD_HEAVEN_RATIO = 0.30;


const CLOUD_SPEED = 1.0;
const CLOUD_FADE = 2;
const CLOUD_LIFE = 900;
const CLOUD_PULL = 0.12;        // 吸回线上的力度（越大贴得越紧）
const CLOUD_GRACE = 8;          // 离线很快就重生
const CLOUD_THRESHOLD = 100;

// ★ Perlin noise 参数（粒子摆动，原有的，没动）
const CLOUD_NOISE_SCALE = 0.01;
const CLOUD_NOISE_SPEED = 0.005;
const CLOUD_NOISE_TURN = 0.08;

const CLOUD_ALPHA = 70;
const CLOUD_WEIGHT = 4;
const CLOUD_COUNT = 1200;

// ★★★ 新增：雾层参数 ★★★
// 雾是一片缓慢漂移的 Perlin noise 浓度场：
// 浓的地方云纹显现，稀的地方云纹隐去，像雾气在天界滚动
const FOG_SCALE = 0.004;    // 雾团的空间尺度（越小雾团越大块）
const FOG_SPEED = 0.002;    // 雾漂移速度（越大显隐变化越快）
const FOG_LOW = 0.35;       // 浓度低于这个值 → 完全隐去
const FOG_HIGH = 0.65;      // 浓度高于这个值 → 完全显现
                            // 两者之间平滑过渡；想显隐对比更"硬"就把两个值靠近

const CLOUD_PALETTE = [
  [196, 160, 98],   // 鎏金
  [230, 200, 140],  // 亮金
  [235, 230, 220],  // 月白
];



class Part1 {
  constructor(areaW, areaH) {
    this.fixed = (areaW !== undefined);
    this.ready = false;

    if (this.fixed) {
      this.areaW = areaW;
      this.areaH = areaH;
      this.areaY = 0;
    } else {
      this.areaW = width;
      this.areaY = this.calcAreaY();
      this.areaH = this.calcAreaH();
    }

    loadImage(CLOUD_IMG_PATH, (img) => {
      this.srcImg = img;
      this.buildCanvas();
      this.ready = true;
    });
  }

  calcAreaY() {
    let base = (typeof heavenTop !== 'undefined') ? heavenTop : 0;
    return max(0, base + CLOUD_OFFSET_Y);
  }

  calcAreaH() {
    let h = height * CLOUD_HEAVEN_RATIO;
    if (typeof earthTop !== 'undefined' && earthTop > this.areaY) {
      h = min(h, earthTop - this.areaY);
    }
    return h;
  }

  buildCanvas() {
    let w = ceil(this.areaW);
    let h = ceil(this.areaH);

    this.pg = createGraphics(w, h);
    this.pg.clear();
    this.guide = createImage(w, h);
    this.guide.copy(
      this.srcImg,
      0, 0, this.srcImg.width, this.srcImg.height,
      0, 0, w, h
    );
    this.guide.loadPixels();

    this.dots = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      this.dots.push(new CloudDot(this));
    }
  }

  brightnessAt(x, y) {
    let ix = floor(constrain(x, 0, this.guide.width - 1));
    let iy = floor(constrain(y, 0, this.guide.height - 1));
    let idx = 4 * (iy * this.guide.width + ix);
    let p = this.guide.pixels;
    let bri = (p[idx] + p[idx + 1] + p[idx + 2]) / 3;
    let alpha = p[idx + 3];

    return (255 - bri) * (alpha / 255);
  }

  // 返回梯度向量（指向墨线中心），切线由粒子自己算
  gradientAt(x, y) {
    let d = 2;
    let gx = this.brightnessAt(x + d, y) - this.brightnessAt(x - d, y);
    let gy = this.brightnessAt(x, y + d) - this.brightnessAt(x, y - d);
    return createVector(gx, gy);
  }

  // ★★★ 新增：读取某位置的雾层浓度，返回 0（全隐）~ 1（全显） ★★★
  // 用一条独立的 noise 维度（+1000 偏移），避免和粒子摆动的 noise 串台
  fogDensityAt(x, y) {
    let n = noise(
      x * FOG_SCALE + 1000,
      y * FOG_SCALE + 1000,
      frameCount * FOG_SPEED
    );
    // 把 FOG_LOW ~ FOG_HIGH 之间映射成 0~1，外侧截断，中间平滑
    let t = constrain((n - FOG_LOW) / (FOG_HIGH - FOG_LOW), 0, 1);
    return t * t * (3 - 2 * t); // smoothstep，过渡更柔
  }

  update() {
    if (!this.ready) return;

    if (!this.fixed) {
      this.areaY = this.calcAreaY();
      let newW = width;
      let newH = this.calcAreaH();
      if (abs(newW - this.areaW) > 1 || abs(newH - this.areaH) > 1) {
        this.areaW = newW;
        this.areaH = newH;
        this.buildCanvas();
      }
    }

    this.pg.erase(CLOUD_FADE);
    this.pg.noStroke();
    this.pg.rect(0, 0, this.areaW, this.areaH);
    this.pg.noErase();

    for (let i = 0; i < this.dots.length; i++) {
      this.dots[i].update();
      this.dots[i].draw(this.pg);
    }
  }

  display() {
    if (!this.ready) return;
    image(this.pg, 0, this.areaY);
  }

  onResize() {
    if (this.fixed || !this.ready) return;
    this.areaW = width;
    this.areaY = this.calcAreaY();
    this.areaH = this.calcAreaH();
    this.buildCanvas();
  }
}


class CloudDot {
  constructor(parent) {
    this.parent = parent;
    this.spawn();
  }

  spawn() {
    let p = this.parent;
    let x, y, found = false;
    
    for (let tries = 0; tries < 100; tries++) {
      x = random(p.guide.width);
      y = random(p.guide.height);
      if (p.brightnessAt(x, y) > CLOUD_THRESHOLD) { found = true; break; }
    }
    this.pos = createVector(x, y);
    this.prev = this.pos.copy();

    
    let g = p.gradientAt(x, y);
    this.vel = createVector(-g.y, g.x);
    if (this.vel.mag() < 0.001) this.vel = p5.Vector.random2D();
    if (random() < 0.5) this.vel.mult(-1);
    this.vel.setMag(CLOUD_SPEED);

    this.grace = CLOUD_GRACE;

    let c = random(CLOUD_PALETTE);
    this.col = color(c[0], c[1], c[2], CLOUD_ALPHA);

    this.life = random(CLOUD_LIFE * 0.5, CLOUD_LIFE);
    this.maxLife = this.life;
  }

  update() {
    let p = this.parent;

    let g = p.gradientAt(this.pos.x, this.pos.y);

    // 切线方向（沿线走）
    let tangent = createVector(-g.y, g.x);
    // 选和当前前进方向同侧的切线，粒子才会一路顺着线滑，不抽搐
    if (tangent.dot(this.vel) < 0) tangent.mult(-1);

    if (tangent.mag() > 0.001) {
      tangent.setMag(CLOUD_SPEED);
      // 向心力：梯度指向墨线中心，偏了就被拉回来
      let pull = g.copy().limit(CLOUD_SPEED * 2).mult(CLOUD_PULL);
      this.vel.add(p5.Vector.sub(tangent, this.vel).mult(0.2)); // 缓慢转向切线
      this.vel.add(pull);                                        // 吸附回线
      this.vel.setMag(CLOUD_SPEED);
    }
    // 线很粗的中心处梯度≈0，就保持原方向直走，自然会走到边缘再被引导

    // ★ Perlin noise: small natural wobble, so the flow is not stiff
    let n = noise(
      this.pos.x * CLOUD_NOISE_SCALE,
      this.pos.y * CLOUD_NOISE_SCALE,
      frameCount * CLOUD_NOISE_SPEED
    );
    this.vel.rotate(map(n, 0, 1, -CLOUD_NOISE_TURN, CLOUD_NOISE_TURN));

    this.prev = this.pos.copy();
    this.pos.add(this.vel);

    this.life--;

    // 离线判定：宽限很短，走丢立刻重生
    if (p.brightnessAt(this.pos.x, this.pos.y) < CLOUD_THRESHOLD * 0.4) {
      this.grace--;
    } else {
      this.grace = CLOUD_GRACE;
    }

    if (
      this.life <= 0 ||
      this.grace <= 0 ||
      this.pos.x < 0 || this.pos.x >= p.guide.width ||
      this.pos.y < 0 || this.pos.y >= p.guide.height
    ) {
      this.spawn();
    }
  }

  draw(pg) {
    // ★★★ 新增：读取雾层浓度，决定这一笔显不显 ★★★
    let fog = this.parent.fogDensityAt(this.pos.x, this.pos.y);
    if (fog <= 0.01) return; // 雾太稀 → 直接不画，粒子照常运动（位置不受影响）

    let w = map(this.life, 0, this.maxLife, 0.3, CLOUD_WEIGHT);
    // 用雾浓度缩放透明度，替代原来固定的 CLOUD_ALPHA
    pg.stroke(red(this.col), green(this.col), blue(this.col), CLOUD_ALPHA * fog);
    pg.strokeWeight(w);
    pg.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}