# Code Quality Standards

**Purpose:** the "good programmer" rules the agent must follow and review against. **Read in:** M1, and by every reviewer.

1. TypeScript `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`; no `any` (use `unknown` + narrowing); no non-null `!` without a comment explaining why safe.
2. Small modules (< 250 lines), single responsibility, explicit interfaces; dependencies point inward (see architecture doc). No circular imports (lint rule).
3. Pure logic separated from DOM/GL so it is unit-testable. Magic numbers live in `config.ts` or are named constants with units in the name (`..._MS`, `..._M`).
4. No dead code, no commented-out code, no unused exports, no placeholder/"coming soon" UI, no fake interactivity (use `anti-ai-slop-auditor` each milestone).
5. Comments explain *why*, not *what*. GLSL files start with a header describing inputs/uniforms. Public functions have TSDoc where non-obvious.
6. Errors: fail fast at boundaries; never swallow errors silently; the only allowed empty-catch is the documented localStorage guard with a comment.
7. No per-frame allocation in `update()` paths; no `new` inside loops; reuse scratch objects.
8. Resource ownership: whoever creates a GPU/audio/DOM/timer resource disposes it; add a dispose test or leak check for each system.
9. Naming: `camelCase` functions/vars, `PascalCase` classes/types, `SCREAMING_SNAKE` constants, files match primary export.
10. Security: no `innerHTML` with dynamic strings (use `textContent`/DOM APIs); no `eval`/`new Function`; same-origin only.
11. Formatting by Prettier; lint by ESLint with `--max-warnings 0`.
12. Every commit is atomic and green; PRs are small and described (see git doc).
13. Dependencies: only those allowed in `technology-decisions.md`; exact version pins; lockfile committed.
14. Accessibility is a requirement, not polish: semantic elements first, ARIA second.
15. When a shortcut is tempting, write the ADR instead of taking it silently.
