# Backend Specification — Decision: NONE

**Status:** decided (ADR-003). Grass v1 has no server, database, auth or API.

**Why:** no requirement needs persistent shared data. The only persistence is per-browser localStorage (`grass:mood`, `grass:muted`, `grass:hints-seen`). Hosting is static on Vercel.

**Rules for the agent:** do not add serverless functions, analytics endpoints, databases, auth or third-party SDKs. `vercel.json` only contains headers/redirects. No network requests after load. If a future feature needs a backend (shared moments, counters), that is a new product decision requiring human approval and a new spec.

**Privacy statement for the how-it-works dialog:** "only your mood and mute setting, in your own browser."
