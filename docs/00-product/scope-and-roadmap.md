# Scope and Roadmap

**Purpose:** what is in the MVP, what is optional, what is explicitly out. **Rule:** anything not in "MVP" is OUT unless the human approves it (README §9).

## MVP (must ship in v1.0.0)
All FR/NFR in `requirements.md`. Features: entry overlay, hill-meadow world, instanced grass + wind, 3 moods, brush + hand cursor, lie-down, seeds, fireflies, HUD + mood switcher, hints + how-it-works, uptime, easter eggs, procedural audio, touch support, accessibility + reduced motion, fallbacks, adaptive quality, 404, metadata, CI/CD, Vercel production.

| Feature | User value | Complexity | MVP |
|---|---|---|---|
| Instanced grass + wind | the whole point | High | Yes |
| Brush trail with spring-back | delight, core | Medium | Yes |
| Lie-down camera dip | cozy signature | Low–Med | Yes |
| Seeds | small reward | Low | Yes |
| Moods (3) | variety, shareability | Medium | Yes |
| Fireflies | night magic | Low | Yes |
| Procedural audio | immersion | Medium | Yes |
| Dev-voice guidance + eggs | personality | Low | Yes |

## Optional enhancements (only after M12 passes, only with human approval)
OE-01 golden-hour pollen motes · OE-02 fireflies flee from brush · OE-03 dawn ground mist · OE-04 "save wallpaper" PNG button · OE-05 butterflies · OE-06 instanced wildflowers · OE-07 PWA/offline · OE-08 CC0 audio samples upgrade (planned as M9b; skipped if no suitable licensed files).

## Future experiments (not planned)
FE-01 first-person walking · FE-02 WebGPU path · FE-03 more biomes · FE-04 shareable moments needing a backend · FE-05 editor-extension break reminder · FE-06 timer/pomodoro mode.

## Explicit non-goals
Accounts, analytics, backend/database, ads, real-time shadows, post-processing pipeline, physics engine, multiplayer, CMS, i18n (English only), plucking/removing blades, React/Next/R3F, gamification (scores, streaks), notification prompts.

## Roadmap
Milestones M0–M13 in `06-delivery/implementation-plan.md`. v0.x tags may be created at human-approved milestones; `v1.0.0` at M13.
