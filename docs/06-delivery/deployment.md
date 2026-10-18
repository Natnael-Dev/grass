# Deployment (Vercel, static)

**Purpose:** how to ship. **Read in:** M12–M13. Use MCP `vercel` (and the human's confirmation at G12).

## Strategy
No Vercel project/production deploy exists until M13 (so unfinished work is never public). In M13: create/link the Vercel project to the GitHub repo via the MCP (or instruct the human if the MCP can't), preset **Vite**, build `npm run build`, output `dist`, Node = repo LTS, no env vars. Create a **preview deployment** from the release-candidate branch for the final human test. Only after G12 approval: promote/merge to `main` and deploy to **production**.

## `vercel.json` (create in M1, verify in M13)
```json
{
  "cleanUrls": true,
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "no-referrer" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
    ]},
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```
Verify CSP does not break the app (e.g. blob/worker/inline style needs). Tighten `style-src` to hashes if feasible; any loosening is documented in an ADR. Inline scripts are not allowed (all JS bundled), so the 404 page and fallback must not use inline JS.

## Release checklist (M13)
1. All gates G1–G11 done; `npm run check` green on `main`; CHANGELOG ready.
2. Create project + preview deploy; run Playwright smoke against the preview URL (same-origin only, headers present, 404 works, no console errors).
3. Human final test on the preview URL → "approved G12".
4. Production deploy (merge to `main` with Vercel Git integration, or `vercel deploy --prod` via MCP). Record the production URL in README and PROGRESS.
5. Run production smoke test (Playwright against production URL, Lighthouse run) → evidence.
6. Tag `v1.0.0`, create GitHub Release (notes from CHANGELOG), swap README (public README created, agent README moved to `docs/AGENT-README.md`, update `AGENTS.md` pointer) in a final `docs:` PR **before** tagging.
7. Optional (ask human): custom domain via the vercel MCP.

## Rollback
Vercel instant rollback to the previous deployment; or `git revert` the offending commit(s) via PR. Never force-push.

## Monitoring
None required (no analytics). Optionally check Vercel logs for 404 patterns. Do not add UptimeRobot unless the human asks.
