# Checkpoint and Gate Protocol

**Purpose:** what "done" means and how to ask the human to test.

## Evidence package (per milestone) in `tracking/evidence/Mx/`
- `README.md`: commands run (verbatim) with pass/fail, requirement IDs covered, screenshot list with 3–5 lines of *what you saw and judged*, known limitations, review swarm summary, links to commits.
- Screenshots (<= 150 KB each, PNG-8/WebP), trace/Lighthouse summaries (text/JSON, trimmed), test output excerpts.
Evidence must be produced by actually running things in this session. Never fabricate output.

## Gate checklist (copy into the evidence README and tick)
- [ ] Milestone tasks all done; no TODO/FIXME left behind
- [ ] `npm run check` passed (paste summary)
- [ ] Milestone-specific gate commands passed (list)
- [ ] Screenshots viewed and judged against the relevant checklist
- [ ] Review swarm done; blockers/majors fixed
- [ ] Docs/ADR updated if anything deviated
- [ ] PROGRESS.md and TRACEABILITY.md updated
- [ ] Commits atomic, conventional; tree clean

## Human Test Request (print this in chat and mirror in PROGRESS)
```
HUMAN TEST REQUEST — Gate Gx (Milestone Mx: <name>)
Run:        git switch <branch> && npm install && npm run dev   → http://localhost:5173 (add ?debug=1 for fps)
Try:        1) … 2) … 3) …   (concrete actions)
Good looks like: … (feel/visual criteria)
Please report: fps (?debug=1), anything ugly/janky, copy tweaks
Known limitations: …
Evidence: tracking/evidence/Mx/README.md
Reply: "approved Gx" or "Gx: change …"
```
Then STOP. Do not push, open PRs, or start the next milestone (strict mode).

## On approval ("approved Gx")
Mirror in USER-APPROVALS.md (date), push branch, open PR (template), wait for CI green, rebase-merge, delete branch, sync main, update PROGRESS, start next milestone.

## On change requests
Create tasks, implement as new atomic commits, re-run gate + review, update evidence, re-request. Don't argue the spec; if feedback contradicts a doc, update the doc/ADR (human is the product owner) in a `docs:` commit.

## Trust mode
Same evidence and gates; after automated gates + review pass, push/PR/merge yourself and continue. Still print a short "Test when convenient" note.

## Never
Write "approved" yourself · mark a gate passed without evidence · skip the review swarm · move on with failing checks.
