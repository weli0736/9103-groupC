# TODO: Project Title

> TODO: One-line description of the project.
> e.g. An interactive p5.js piece that moves through three layers of a Chinese cosmology: Heaven, the human world, and Earth.

**Live prototype:** TODO: link
**Team:** Kristen Li/ Haocheng //· TODO: other members

---

## 1. Inspiration

TODO: What is the source material? (story / painting / myth / concept)

- TODO: Inspiration 1
- Part 1 – Celestial Mist (kristen)

- **Chinese ‘Xiangyun’ Cloud Motifs**
These sinuous cloud patterns are commonly found on Han Dynasty palaces, ceremonial robes and ceramics. In Chinese art, they symbolise the heavens and the realm of the divine. I used an image of auspicious clouds as an invisible guide. At the same time, the cloud patterns also signify the natural cycles of the celestial realm and divine revelations. Particles move along their contour trajectories, causing the pattern to be naturally outlined in gold.
- **Mist in Chinese Landscape Painting**
In landscape paintings, mist obscures parts of the mountains. The viewer can never see the entire scene at a glance. That vast and hazy expanse is precisely where I began to create the mist layer.
- **Moonlight**
I did not want a grey, murky haze. I wanted this mist to evoke the crisp moonlight of a dark night. Consequently, it appears as a warm white, with a slight sense of transparency.

**How this has influenced my design:**
The celestial realm is not meant to be easily seen. The viewer must slow their pace to seek it out. Consequently, the cloud patterns are initially completely concealed. They only reveal themselves as you move, and do so very gradually. Once you stop, the mist will conceal them once more.
- TODO: Inspiration 2  (e.g. artwork, website, game)
  TODO: link + one or two sentences.
- TODO: Inspiration 3**
  TODO

**How this shaped our approach:**
TODO: 2–4 short sentences. e.g. We wanted the viewer to "earn" the image. So the heaven layer starts hidden under thick fog. You have to move to see it.

---

## 2. Techniques

### Overview
TODO: How is the project structured? e.g.
`sketch.js` sets up the canvas and calls each part. Each mechanic lives in its own file as a class with `update()` and `display()`. Parts talk through a few global variables (`isIdle`, `heavenTop`, `earthTop`).

### Part 1 – Heavenly Fog & Cloud Pattern (`perlin-noise.js`)

**How it works**
The file has two parts. The `Part1` class runs the fog. The `P1CloudDot` class is one gold particle. Each frame does four things:

1. Update the reveal mask based on mouse movement.
2. Draw the fog onto its own buffer, with the mask cutting holes in it.
3. Move the particles along the cloud image and draw their trails.
4. Stack the layers: dark background → gold clouds → fog.

**Techniques used**

| Technique | Where | Why |
|---|---|---|
| `noise()` (Perlin noise) | fog texture, particle wobble | Soft natural movement. `random()` looked like static. |
| Domain warping (noise inside noise) | `_renderFog()` | One noise layer looked flat. Feeding one into another makes the fog swirl. |
| `createGraphics()` buffers | `fogG`, `pg` | Fog and clouds are drawn apart, so I can fade the trails without touching the fog. |
| Low-res grid + `loadPixels()` / `updatePixels()` | `_buildFogGrid()`, `_renderFog()` | Noise per pixel was too slow. I calculate it on an 8px grid and scale it up. Faster, and the blur makes it softer. |
| `Float32Array` reveal mask | `_applyMask()` | One value per cell, 0 = fog, 1 = clear. Cleared areas stay open until idle. |
| Image brightness gradient | `gradientAt()`, `P1CloudDot` | Particles read the brightness of the xiangyun image and move along its dark lines, not across them. |
| `erase()` with low alpha | `_updateCloud()` | Old strokes fade a little each frame. That leaves a brush-like trail. |
| Smoothstep easing | mask edges, fog density | No hard edges. Everything fades in and out. |

**Key decisions**
- **Speed limit.** The reveal can only grow by `REVEAL_SPEED` per frame. Shaking the mouse fast does nothing special. I wanted the piece to reward slow movement.
- **Torn edges.** Cells don't clear in a perfect circle. Distance from the mouse is mixed with a fixed noise pattern. The holes look like mist breaking up.
- **Fog colour.** My first version used grey. On the dark background it looked dirty. I switched to a warm moon-white.
- **Closing on idle.** I use Haocheng's global `isIdle`. When it's true, the reveal drops back to 0 over `CLOSE_SECONDS`.
- **One config block.** All numbers sit in `P1_FOG` and `P1_CLOUD` at the top of the file. Tuning was much easier this way.

### Part 2 – TODO: Mechanic Name (`TODO.js`)
TODO: techniques used + why

### Part 3 – TODO: Mechanic Name (`TODO.js`)
TODO

### Part 4 – TODO: Mechanic Name (`TODO.js`)

---

## 3. Mechanic Ownership

| Member | Mechanic | File | What it does |
|---|---|---|---|
|  Kristen | Heavenly fog & cloud pattern | `perlin-noise.js` | A thick moonlit fog covers the heaven layer. Moving the mouse slowly clears it bit by bit. Underneath, gold particles trace a xiangyun cloud pattern. When the viewer stops (`isIdle`), the fog slowly closes again.  |
| Haocheng | TODO: e.g. idle detection / TODO | `TODO.js` | TODO. Provides the global `isIdle` used by Part 1. |
| Yuanze | TODO | `TODO.js` | TODO |
| Junyu | TODO | `TODO.js` | TODO |

---

## 4. AI Acknowledgement

We used AI tools in parts of this project. Every AI-assisted section is also marked in the code with a comment.

| Tool | Used by | File / section | What it was used for |
|---|---|---|---|
Part 1 (Kristen)

I used **Claude (Anthropic)** while building the fog system. The particle idea and the cloud image guide were mine. Claude helped with:

- **Fog rendering (`_renderFog()`, `_buildFogGrid()`)**: the low-res grid and the domain-warped noise.
- **Reveal mask (`_applyMask()`)**: storing one value per cell and mixing mouse distance with noise for torn edges.
- **Speed limit (`update()`)**: making the reveal follow a target value by a small step each frame.
- **Refactoring**: moving all parameters into `P1_FOG` and `P1_CLOUD`.
- **Fog colour**: changing grey fog to warm moon-white.

**How the AI-assisted code works**
1. The canvas is split into 8px cells. Each cell gets a fog value from two layers of Perlin noise, one warping the other.
2. Each cell has a mask value from 0 (fog) to 1 (clear).
3. Mouse movement raises a target. The real reveal value chases it, but only by `REVEAL_SPEED` per frame.
4. A cell clears when the reveal passes its threshold. The threshold = distance from mouse + fixed noise. So edges look ragged.
5. When `isIdle` is true, the target drops to 0 and the fog closes over `CLOSE_SECONDS`.

**What I did myself**
I designed the particle system and picked the guide image. I tested and tuned every value in the config. I connected the fog to `isIdle`. I read through the AI code and changed it until I understood each step.

All AI-assisted sections are marked in the code with `// [AI]`.
| TODO | TODO | TODO | TODO |

**How the AI-assisted code works (Part 1):**
1. The screen is split into an 8px grid. Each cell gets a fog colour from layered Perlin noise.
2. Each cell also has a mask value from 0 (full fog) to 1 (clear).
3. Mouse movement raises a target value. The real reveal value follows it, but only by a small step each frame. That keeps it slow.
4. Cells clear based on their distance from the mouse plus a fixed noise pattern. That's why the edges look torn, not round.
5. When `isIdle` is true, the reveal value goes back down over `CLOSE_SECONDS` and the fog returns.

**What we changed / understood ourselves:**
TODO: e.g. We tuned all the values, tested different colours, and connected it to Haocheng's `isIdle`.

---

## 5. External References

| Source | Link | How it influenced us | Used in |
|---|---|---|---|
|kristen： p5.js Reference – `noise()` | https://p5js.org/reference/p5/noise/ | How Perlin noise works in p5 | `perlin-noise.js` |
| p5.js Reference – `createGraphics()` | https://p5js.org/reference/p5/createGraphics/ | Off-screen layers for fog and clouds | `perlin-noise.js` |
| p5.js Reference – `erase()` | https://p5js.org/reference/p5/erase/ | Fading the particle trails | `_updateCloud()` |
| Inigo Quilez – Domain Warping | https://iquilezles.org/articles/warp/ | Noise inside noise, for swirling fog | `_renderFog()` |
| The Coding Train – Perlin Noise Flow Field | https://www.youtube.com/watch?v=BjoM9oKOAKY | Particles moving along a field | `P1CloudDot` |
| TODO | TODO | TODO | TODO |

> TODO: Keep only the sources you actually used.

---

## 6. Interaction Instructions

1. Kristen: - **Move the mouse slowly over the top of the screen.** The fog opens where you move. Gold cloud lines appear underneath.
            - **Moving fast won't help.** The fog has a speed limit. Slow and steady works best.
            - **Stop moving for a few seconds.** The fog drifts back and hides the clouds again.
5. TODO: Part 2 interaction
6. TODO: Part 3 interaction

**Tips:** TODO: e.g. Use Chrome, full screen. If it lags, lower `P1_CLOUD.COUNT`.

---

## 7. File Structure

```
TODO-repo-name/
├── index.html
├── sketch.js           # setup, draw, windowResized; calls each part
├── perlin-noise.js     # Part 1 – fog & cloud pattern (Kristen)
├── TODO.js             # Part 2 – TODO
├── TODO.js             # Part 3 – TODO
├── assets/
│   └── TODO.png        # cloud pattern guide image
└── README.md
```

---

## 8. Code Comments

Each file has a header that says who wrote it and what it does. AI-assisted and borrowed code is marked inline, like this:

```js
// [AI] This code was generated with the help of Claude and does ...
// [REF] This technique is from https://...
```# 9103-groupC
