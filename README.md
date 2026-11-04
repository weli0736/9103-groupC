# 9103 Group C — Awakening Heaven
## 1. Inspiration and Core Concept
> “Death is not the end. Forgetting is.”

Our project draws on Chinese mythology and the Mawangdui silk painting. Without an audience, the heavenly world remains trapped in a lifeless cycle. Through movement and listening, viewers clear the fog and bring it back to life.

The experience follows four connected states:

**Slumber → Awakening → Resonance → Oblivion → Slumber**

- **Slumber:** Fog hides the painting. The sun and moon repeat their cycle above it. A lantern bearer glows faintly blue.
- **Awakening:** Mouse movement clears the fog and warms the lantern. The sun and moon pause. The Fusang tree grows fruit, and the toad begins to glow and float.
- **Resonance:** Mouse clicks trigger three sounds. The dragons regain colour, breathe, and rotate.
- **Oblivion:** After 10 seconds without movement or clicks, the sound fades, fog returns, and the world falls asleep again.

### Individual Inspirations
- **Kristen Li:** Chinese cloud motifs, mist in landscape paintings, and soft  moonlight inspired the fog and golden cloud particles. The cloud guide image comes from《中国纹样全集》, accessed through [Pinterest](https://ch.pinterest.com/pin/5488830777107015/).
- **Haocheng Gong:** [Add your specific inspirations and their influence.]
- **Yuanze Lin:** [Add your specific inspirations and their influence.]
- **Junyu Cai:** [Add your specific inspirations and their influence.]
## 2. Techniques
The project uses p5.js. `sketch.js` coordinates the main scene. Each mechanic responds to shared interaction and idle states.

### Time-based Animation — Haocheng Gong
- Use `millis()` to track inactivity. Mouse movement or clicks reset the timer.
- Share `isIdle` with the other mechanics after 10 seconds without input.
- Run a 20-second sun and moon cycle during idle mode.
- During awakening, pause this cycle and use time to animate Fusang fruit growth and the toad’s gentle floating motion.

**Key decision:** One shared timer keeps all mechanics in the same state.

### User Input — Junyu Cai
- Read mouse movement to activate the lantern and reset inactivity.
- Use `lerpColor()` to blend the lantern from cold blue to warm yellow, while expanding its glow.
- Use `mousePressed()` to cycle through three sounds: jade chime, war drum, and chant.

**Key decision:** Movement reveals the scene; clicks activate sound and dragon responses.

### Perlin Noise — Kristen Li
- Use Perlin noise and domain warping to create flowing fog.
- Use `createGraphics()` to separate fog and particle layers.
- Calculate fog on a low-resolution grid to reduce computation.
- Store local visibility in a reveal mask. Mouse movement gradually clears nearby fog; idle mode restores it.
- Use image brightness gradients to guide golden particles along cloud contours.
- Use `erase()` to fade old particle trails.

**Key decision:** Fog and cloud particles use separate drawing layers. A gradual reveal limit encourages slow exploration.

### Audio Feedback — Yuanze Lin
- Read sound amplitude to control the dragons’ response.
- Use `lerpColor()` to restore their colour.
- Use `lerp()` and `scale()` for smooth, amplitude-driven breathing.
- Use `translate()` and `rotate()` to turn each dragon around its centre.
- During idle mode, fade the audio and reset the dragons to grey and still.

**Key decision:** The dragons respond to user-triggered sounds rather than playing music automatically.

## 3. Mechanics and Responsibilities
| Member | Mechanic | Main responsibilities |
| --- | --- | --- |
| Haocheng Gong | Time-based animation | Shared idle timer, `isIdle`, sun and moon cycle, Fusang fruit growth, and toad animation. |
| Junyu Cai | User input | Lantern colour and glow, mouse interaction, and cycling through three sounds on clicks. |
| Kristen Li | Perlin noise | Full-screen fog, gradual mouse-based revealing, golden cloud patterns, and fog restoration. |
| Yuanze Lin | Audio feedback | Dragon colour, amplitude-driven scaling, rotation, and audio fade-out during idle mode. |

## 3. Mechanics and Responsibilities
| Member | Mechanic / File | What it does |
| --- | --- | --- |
| Kristen | Heavenly fog and cloud patterns / `perlin-noise.js` | Slowly reveals golden cloud patterns through mouse movement and restores fog when idle. |
| Haocheng Gong | [Mechanic / file] | Provides `isIdle`. [Add your mechanic’s main behaviour.] |
| Yuanze Lin | [Mechanic / file] | [Describe what your mechanic does.] |
| JunYu | [Mechanic / file] | [Describe what your mechanic does.] |

## 4. AI Acknowledgement
### Kristen
I used **Claude** to help write fog rendering, reveal masks, reveal-speed control, and organise parameters.

The assisted code calculates noise on a low-resolution grid. A mask stores values from 0 (covered) to 1 (clear). Mouse movement increases local visibility. During idle mode, visibility decreases and fog returns.

I developed the particle effect concept, selected the guide image, reviewed the code, and adjusted colours and parameters. I also connected the fog to `isIdle`.

**ChatGPT** helped organise, shorten, and translate this README.


### Other Members
- **Haocheng Gong:** [Name the AI tool, its purpose, and how the assisted code works. Write “None” if unused.]
- **Yuanze Lin:** [Name the AI tool, its purpose, and how the assisted code works. Write “None” if unused.]
- **JunYu:** [Name the AI tool, its purpose, and how the assisted code works. Write “None” if unused.]

Mark each AI-assisted section in the actual code, for example:

    // [AI] Claude helped generate this reveal mask.
    // It stores fog visibility per grid cell and updates it during interaction.

## 5. External References
### Kristen
- [Cloud motif — Pinterest](https://ch.pinterest.com/pin/5488830777107015/): From《中国纹样全集》. Used as the guide image for golden cloud particles.
- [daydev — OpenProcessing](https://openprocessing.org/@daydev/2659627/): Inspired the use of Perlin noise in particle movement. The reference converts noise values into movement angles. In my version, image gradients guide particles along cloud contours, while noise adds a slight wobble. The reference does not provide the fog rendering or reveal mask.
- [p5.js — noise()](https://p5js.org/reference/p5/noise/): Used to understand smooth noise and its sampling coordinates.
- [p5.js — createGraphics()](https://p5js.org/reference/p5/createGraphics/): Used to create separate fog and particle buffers.
- [p5.js — erase()](https://p5js.org/reference/p5/erase/): Used to fade old particle trails.
- [Inigo Quilez — Domain Warping](https://iquilezles.org/articles/warp/): Referenced for distorting noise coordinates to create swirling fog.

### Other Members
- **Haocheng Gong:** [Add source links and explain what you used or adapted.]
- **Yuanze Lin:** [Add source links and explain what you used or adapted.]
- **JunYu:** [Add source links and explain what you used or adapted.]

Add source comments beside referenced or adapted code, for example:

    // [REF] Domain warping: https://iquilezles.org/articles/warp/
    // Noise offsets distort the sampling coordinates to create swirling fog.

## 6. Interaction Instructions
### Kristen — Heavenly Fog
1. Slowly move the mouse across the top of the scene to clear the fog.
2. Watch golden cloud patterns appear. Fast movement does not increase the reveal speed.
3. Stop moving. Once the scene becomes idle, fog gradually covers the patterns again.

### Other Members
- **Haocheng Gong:** [Explain how users interact with your mechanic.]
- **Yuanze Lin:** [Explain how users interact with your mechanic.]
- **JunYu:** [Explain how users interact with your mechanic.]

## 7. Code Comments
Each member must:
- Use clear variable and function names.
- Explain main functions, key calculations, and non-obvious behaviour.
- Briefly explain tools or techniques used beyond the course and cite their sources.
- Mark AI-assisted code with the tool name and what the code does.
- Mark borrowed or adapted code with its source link and explain any changes.
