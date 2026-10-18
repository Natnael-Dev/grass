# Anti-Drift and Loop Rules

**Purpose:** keep a fast autonomous model honest over a long run.

## Anti-skipping
- Never begin a milestone without reading its **Read** docs this session (after compaction, re-read the current ones).
- Every task in a milestone must appear in `tracking/plans/Mx.md` and be ticked with a commit SHA. Unticked tasks block the gate.
- Before claiming a gate pass, re-open the milestone section and check each **Gate** line literally.
- Before declaring a milestone done, grep the milestone's requirement IDs in `acceptance-criteria.md` and confirm each.

## Anti-assumption
Docs silent → Undocumented Decision Protocol (README §9). Do not rely on memory of "how Three.js usually works": verify with Context7. Do not copy random snippets from the internet without understanding them and checking the licence (prefer writing your own).

## Anti-big-bang
Max ~300 changed lines per commit. Never write the whole app, or an entire system, then debug. Build the smallest visible slice, look at it, extend. Commit after each slice.

## Anti-premature-victory
Phrases like "should work", "looks correct", "I believe" are not evidence. Run it, look at it, record it. "Tests pass" is insufficient for visual features: view screenshots. Declaring completion early is the primary failure mode; the README §11 checklist is the only authority.

## Loop discipline
- Attempt log per failing check (max 3; different hypotheses; see README §8).
- After 3: BLOCKERS entry → `/boost` → different approach (documented simpler fallback in the relevant doc, e.g. lower tier, fewer trail points, simpler shader) → if the fallback changes behavior, ADR + ask the human.
- No infinite polling: CI waits max 15 min per check, then inspect logs.
- If you notice yourself repeating the same action, stop, summarize what you know, change the approach.

## Scope control
Optional enhancements, future experiments and non-goals are out. "While I'm here" improvements go to a GitHub issue, not the diff.

## Integrity
Never delete/skip/weaken tests, budgets, lint rules or requirements to get green. Never edit docs to make a failure disappear (docs change only with an ADR/human approval). Never fabricate evidence. Report failures honestly to the human with the exact error.

## Context management
`/compact` at ~70%. Tracking files are your memory: keep PROGRESS.md current after every task so a reset costs nothing.

## Self-audit questions (ask at each gate)
1. What requirement IDs did this milestone own, and where is the evidence for each?
2. What did I assume? Is it logged?
3. What did I not look at with my own eyes?
4. What would the human complain about in 30 seconds of playing?
