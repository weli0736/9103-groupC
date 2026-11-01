# TODO: Project Title

> TODO: One-line description of the project.
> e.g. An interactive p5.js piece that moves through three layers of a Chinese cosmology: Heaven, the human world, and Earth.

**Live prototype:** TODO: link
**Team:** Kristen · Haocheng · TODO: other members

---

## 1. Inspiration

TODO: What is the source material? (story / painting / myth / concept)

- **TODO: Inspiration 1** (e.g. traditional Chinese auspicious cloud pattern 祥云)
  TODO: What did you take from it? How did it shape the visuals?
- **TODO: Inspiration 2** (e.g. artwork, website, game)
  TODO: link + one or two sentences.
- **TODO: Inspiration 3**
  TODO

**How this shaped our approach:**
TODO: 2–4 short sentences. e.g. We wanted the viewer to "earn" the image. So the heaven layer starts hidden under thick fog. You have to move to see it.

---

## 2. Techniques

### Overview
TODO: How is the project structured? e.g.
`sketch.js` sets up the canvas and calls each part. Each mechanic lives in its own file as a class with `update()` and `display()`. Parts talk through a few global variables (`isIdle`, `heavenTop`, `earthTop`).

### Part 1 – Heavenly Fog & Cloud Pattern (`perlin-noise.js`)

| Technique | Where | Why |
|---|---|---|
| `noise()` (Perlin noise) | Fog texture, particle wobble, cloud fade | Gives soft, natural movement instead of random jitter |
| Domain warping (noise inside noise) | `_renderFog()` | Makes the fog swirl and look like real cloud masses |
| `createGraphics()` off-screen buffers | `fogG`, `pg` | Fog and cloud trails are drawn separately, then layered |
| Low-res pixel grid + `loadPixels()` / `updatePixels()` | `_buildFogGrid()`, `_renderFog()` | Fog is calculated on an 8px grid and scaled up. Much faster, and softer |
| Reveal mask (`Float32Array`) | `_applyMask()` | Stores how "open" each cell is, so the cleared path stays open |
| Image-guided particles | `P1CloudDot`, `gradientAt()` | Particles read the brightness of a cloud-pattern image and follow its lines |
| `erase()` trail fading | `_updateCloud()` | Old strokes fade slowly and leave a brush-like trail |
| Smoothstep easing | mask + fog density | Soft edges, no hard cut-offs |

**Key decisions**
- The reveal is speed-limited (`REVEAL_SPEED`). Fast mouse movement can't clear the fog instantly. It should feel slow and calm.
- The fog is warm moon-white, not grey. Grey left a dirty layer over the dark background.
- All tweakable values sit in `P1_FOG` and `P1_CLOUD` at the top of the file.

### Part 2 – TODO: Mechanic Name (`TODO.js`)
TODO: techniques used + why

### Part 3 – TODO: Mechanic Name (`TODO.js`)
TODO

---

## 3. Mechanic Ownership

| Member | Mechanic | File | What it does |
|---|---|---|---|
| Kristen | Heavenly fog & cloud pattern | `perlin-noise.js` | Thick fog covers the screen. Moving the mouse slowly clears it and shows gold cloud lines drawn by particles. When the user goes idle, the fog closes again. |
| Haocheng | TODO: e.g. idle detection / TODO | `TODO.js` | TODO. Provides the global `isIdle` used by Part 1. |
| TODO | TODO | `TODO.js` | TODO |
| TODO | TODO | `TODO.js` | TODO |

---

## 4. AI Acknowledgement

We used AI tools in parts of this project. Every AI-assisted section is also marked in the code with a comment.

| Tool | Used by | File / section | What it was used for |
|---|---|---|---|
| Claude (Anthropic) | Kristen | `perlin-noise.js` – `Part1` class (fog system) | Helped write the fog rendering, the reveal mask and the speed limit. Also helped move all parameters into one config block and change the fog colour. |
| Claude (Anthropic) | Kristen | `perlin-noise.js` – `P1CloudDot` | TODO: say exactly what AI did here, e.g. "helped fix particles jittering by choosing the tangent on the same side as the current velocity" |
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
| p5.js Reference – `noise()` | https://p5js.org/reference/p5/noise/ | Basic Perlin noise usage | `perlin-noise.js` |
| The Coding Train – Perlin Noise / Flow Fields | TODO: exact video link | TODO: e.g. idea of particles moving along a noise field | `P1CloudDot` |
| Inigo Quilez – Domain Warping | https://iquilezles.org/articles/warp/ | Feeding noise into noise to make swirling fog | `_renderFog()` |
| TODO: cloud pattern image source | TODO | Guide image the particles follow | `cloudImg` |
| TODO | TODO | TODO | TODO |

> TODO: Keep only the sources you actually used.

---

## 6. Interaction Instructions

1. Open the live prototype: TODO link
2. TODO: e.g. Click once to start (needed for audio).
3. **Move the mouse slowly across the screen.** The fog clears bit by bit and shows the golden clouds.
4. **Stop moving for about TODO seconds.** The fog slowly closes again.
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
