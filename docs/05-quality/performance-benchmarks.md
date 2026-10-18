# Performance Benchmarks and Budgets

**Purpose:** numeric budgets and how to measure. **Read in:** M3, M11, M12. Note: headless software rendering cannot validate GPU fps; budgets marked (HW) are verified by the human's real devices via the `?debug=1` overlay.

| Metric | Budget | Measured by |
|---|---|---|
| Frame time, high tier, 1080p, mid integrated GPU (HW) | avg <= 16.7 ms, p95 <= 20 ms | `?debug=1` |
| Frame time, medium/low on mid phone (HW) | p95 <= 33 ms | `?debug=1` |
| Draw calls per frame | <= 12 (grass = 1) | `renderer.info` |
| Triangles (high) | <= 700k (90k × 7 tris ≈ 630k + world) | `renderer.info` |
| Triangles (low) | <= 80k | `renderer.info` |
| Initial JS (gzip) | <= 300 KB | `npm run size` |
| Total initial transfer | <= 500 KB (excl. optional audio) | Lighthouse/Playwright |
| Optional audio samples | <= 250 KB total, lazy | file sizes |
| Scene init (to first rendered frame) on dev laptop | <= 1500 ms; no single JS task > 50 ms during init after chunking (software GL excluded) | trace |
| Lighthouse (desktop, entry page) | perf >= 85, a11y >= 95, best-practices >= 95, SEO >= 90 | `web-perf` skill |
| Layout shift | CLS <= 0.02 | Lighthouse |
| Long tasks after init | none > 50 ms during idle brushing | trace |
| Heap growth over 10 min | < 10% | `chrome-devtools-mcp` heap snapshots |
| Per-frame allocations (hot path) | 0 (verify via allocation profile / code review) | trace + review |

## Procedure
1. `npm run build && npm run preview`; run Lighthouse on the preview URL; save JSON summary into `tracking/evidence/M11/`.
2. Trace 10 s of brushing at high tier with `chrome-devtools-mcp`; note script/render time; compare before/after each optimization.
3. Soak: `?quality=low`, scripted brush every second for 10 min; snapshots at 1/5/10 min.
4. Record results in a table in `tracking/evidence/M11/README.md`; any miss → optimize (tier tuning, shader simplification) rather than relaxing the budget. A budget may be waived only by the human, recorded in USER-APPROVALS.md.
