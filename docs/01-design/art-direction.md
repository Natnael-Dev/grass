# Art Direction

**Purpose:** the look and behavior of the world. **Read in:** M2, M3, M4, M7. Mood values live in `design-system.md`.

## Style: stylized-painterly (decided)
Soft gradients, rim/back-light on blades, simple silhouettes, a big sun or moon, painterly clouds. NOT photoreal. No textures from photos. Everything procedural (shader, canvas-generated noise, geometry).

## Composition (desktop 16:9 reference)
- Horizon at ~42% from the top. Sun/moon disc in the upper-right third; the tree sits on the hill crest slightly left of centre-right, small (≈12% of frame height).
- Foreground (bottom 35%): dense, tall, close grass with visible individual blades. Midground: rolling hill. Background: 2–3 ridge silhouettes fading into fog, then sky.
- Strong depth cues: fog colour = horizon colour, ridges lighter with distance, blade width/height variation, slight vignette.

## Grass
- Blade: tapered strip, 4 segments (high) / 3 (medium) / 2 (low). Height 0.35–0.9 m (near), 0.6–1.4 m (far, to read at distance). Base width 0.045 m (near) scaled up with distance to avoid aliasing.
- Colour: gradient root→tip (`grassBase`→`grassTip`), per-blade hue/lightness jitter ±8%, root ambient-occlusion darkening (root 55% brightness), subtle back-light translucency toward the sun, rim light at grazing angles. Patches of lighter/darker grass via low-frequency noise (large-scale variation is what makes it feel like a meadow).
- Shape: each blade leans with a per-blade random bend (curved via quadratic along height).
- Normals: blend blade normal 60% toward terrain-up for soft lighting (avoids harsh two-sided shading).

## Wind
Two scrolling noise octaves in world XZ (slow gusts 0.08 Hz-ish + fast flutter), direction mostly +X with slow ±20° drift. Bend ∝ height², tips flutter. Visible travelling "waves" across the meadow are the signature look. Strength is mood-dependent (night calmer).

## Sky
Vertical 3-stop gradient (top/mid/horizon), glowing disc with soft halo, 3-octave FBM clouds drifting slowly (2 octaves on low tier), stars + faint twinkle only at night (hash-based). No bitmap assets.

## Tree
One low-poly silhouette tree (tapered trunk + 5–7 merged icosphere foliage blobs, flat shaded by vertex colour with a light gradient). Gentle wind sway in vertex shader (±0.6° at crown). At night it is a near-silhouette with a rim light.

## Ridges
2–3 large flat-ish meshes with smooth noisy skylines, unlit colour from mood (`ridge1..3`), heavy fog blend.

## Fireflies (night)
Additive point sprites, colour `#d9ff7a`, soft radial falloff, size 6–14 px at 1080p scaled by distance, blink via `smoothstep(0.55,1.0,sin(t*f+phase))²`, slow Lissajous drift, heights 0.2–2.2 m above terrain.

## Seeds
Small white fluffy sprites (canvas-generated 6-spoke radial texture), drift with the wind, sink slowly, fade in/out. Tinted by mood light colour.

## Light and atmosphere
No real-time shadows. Fake AO in grass shader, fog (exp2) with mood colour, vignette + very light grain as CSS overlays (cheap, not post-processing). Colour grading is in the mood data.

## Camera
FOV 48° (landscape), 55° (portrait). Base pose and dip pose in `03-frontend/scene-and-camera.md`.

## Quality bar (checklist the agent MUST verify by *looking* at screenshots)
- [ ] You can see individual blades in the foreground and a smooth meadow in the distance (no shimmering band, no visible grid or tiling).
- [ ] Wind waves travel visibly across the field.
- [ ] Each mood is clearly distinct and attractive; no clipped/blown colours; text stays legible.
- [ ] No blades poke through the terrain or float above it; no hard seam where density rings meet.
- [ ] Horizon blends into fog smoothly; ridges read as layered.
- [ ] The tree reads instantly as a tree.
