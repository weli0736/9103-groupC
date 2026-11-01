// ============================================
// audio-change.js —— 窗口跟随鼠标移动 + 根据窗口位置切换音乐
// sketch.js 里只需要调用这里的三个函数：
//   setup() 里：setupAudioChange()
//   draw() 开头：updateMouseScroll()
//   draw() 结尾：updateMusic() 和 drawMusicHint()
// 用到 sketch.js 里的全局变量：heavenTop、earthTop、underTop、underBottom
// ============================================

// ★★★ 鼠标控制窗口移动 ★★★
// 鼠标在窗口最上面 1/4 → 窗口向上移动；最下面 1/4 → 向下移动；中间部分 → 不移动
// 刚进入移动区时速度最慢，越靠近窗口上/下边缘越快，边缘处是最慢速度的 2 倍
const SCROLL_ZONE = 1 / 4;        // 上下移动区各占窗口高度的比例
const SCROLL_MIN_SPEED = 80;      // 最慢速度（像素/秒）
const SCROLL_MAX_SPEED = SCROLL_MIN_SPEED * 2; // 最快速度（像素/秒）
let scrollPos = 0;                // 窗口当前的滚动位置（用小数记录，移动更顺滑）
let mouseInWindow = false;        // 鼠标是否在窗口里（移出窗口后停止移动）
let mouseWinY = 0;                // 鼠标相对窗口顶部的 y 坐标

// ★★★ 背景音乐：跟着窗口位置切换 ★★★
// 窗口在地下 → music1，在人间 → music2，在天上 → music3
const MUSIC_FILES = ['music/music1.mp3', 'music/music2.mp3', 'music/music3.mp3'];
const MUSIC_FADE_TIME = 3000;     // 一首淡出、另一首淡入所用的时间（毫秒），越大越柔和
const MUSIC_MAX_VOLUME = 0.8;     // 最大音量（0 ~ 1）
// 响度统一系数：三首歌原始响度不同（用 ffmpeg 测得 music1 -18.3、music2 -19.4、music3 -15.4 LUFS）
// 以最小声的 music2 为准，把另外两首调小，让听起来一样响
// 系数 = 10 ^ ((-19.4 - 该曲响度) / 20)；换歌后需要重新测量
const MUSIC_GAINS = [0.88, 1.0, 0.63];
let musicTracks = [];             // 三个 <audio> 元素
let musicLevels = [0, 0, 0];      // 每首歌当前的淡入程度（0 ~ 1）
let musicUnlocked = true;        // 自动播放声音

// 在 sketch.js 的 setup() 里调用一次（画布创建之后）
function setupAudioChange() {
  // ---------- 窗口初始位置：画布最下面 ----------
  // 关掉浏览器"刷新后记住滚动位置"的功能，保证每次都从最下面开始
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollPos = getMaxScroll();
  window.scrollTo(0, scrollPos);

  // ---------- 记录鼠标在窗口里的位置 ----------
  // clientY 是相对窗口（而不是画布）的坐标，正好用来判断上半区 / 下半区
  document.addEventListener('mousemove', function (e) {
    mouseInWindow = true;
    mouseWinY = e.clientY;
  });
  document.documentElement.addEventListener('mouseleave', function () {
    mouseInWindow = false;
  });

  // ---------- 背景音乐 ----------
  for (let i = 0; i < MUSIC_FILES.length; i++) {
    let audio = new Audio(MUSIC_FILES[i]);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = 'auto';
    musicTracks.push(audio);
  }
}
