# air2.earthen.io — Buwana Scope Upgrade: Required Backend Changes

These are the changes needed in the `air2.earthen.io` Node/Express backend to support the new
Buwana namespaced scope system (`buwana:basic`, `buwana:profile`, `buwana:community`, `buwana:bioregion`).

---

## 1. OIDC Callback — Fix namespaced claim extraction

Buwana now includes two JWT claims whose names contain colons. In JavaScript, colon-containing
object keys **must** be accessed with bracket notation, not dot notation.

Find the section of your OIDC callback handler that reads fields from the decoded ID token payload
(typically after `verifyIdToken()` or wherever you decode the JWT) and update it as follows:

```js
// BEFORE — dot notation silently returns undefined for colon-named claims:
const earthlingEmoji = claims.buwana:earthlingEmoji  // SyntaxError / undefined
const community      = claims.buwana:community        // SyntaxError / undefined

// AFTER — bracket notation required:
const earthlingEmoji = claims['buwana:earthlingEmoji'] ?? null
const community      = claims['buwana:community']      ?? null
```

These two fields will be silently missing for every user until this is fixed.

---

## 2. OIDC Callback — Map renamed identity claims

The `buwana:basic` scope now uses standard OIDC claim names. The claim previously called
`first_name` is now `given_name`. Map it explicitly when building the user object.

```js
// Claim name mapping from JWT → internal field names
const userFromToken = {
  buwana_id:       claims.buwana_id,
  email:           claims.email,
  first_name:      claims.given_name   ?? null,   // was claims.first_name
  last_name:       claims.family_name  ?? claims.last_name ?? null,
  earthling_emoji: claims['buwana:earthlingEmoji'] ?? null,

  // buwana:profile
  country:         claims.country      ?? null,
  language:        claims.language     ?? null,
  role:            claims.role         ?? null,
  community_id:    claims.community_id ?? null,

  // buwana:community
  community:       claims['buwana:community'] ?? null,

  // buwana:bioregion
  continent:          claims.continent           ?? null,
  location_full:      claims.location_full       ?? null,
  watershed_id:       claims.watershed_id        ?? null,
  watershed_name:     claims.watershed_name      ?? null,
  location_watershed: claims.location_watershed  ?? null,
  location_lat:       claims.location_lat        ?? null,
  location_long:      claims.location_long       ?? null,
}
```

---

## 3. `/api/me` response — Expose all new fields

The SPA's dashboard reads `me.user` and now expects the full set of Buwana scope fields.
Make sure the `/api/me` handler includes all of them in the response object.

```js
// In your /api/me route handler, build the user object from session / DB / cache:
res.json({
  ok: true,
  user: {
    // From users_tb (always present after login)
    user_id:     dbUser.user_id,
    buwana_sub:  dbUser.buwana_sub,
    buwana_id:   dbUser.buwana_id,
    email:       dbUser.email,
    full_name:   dbUser.full_name,

    // From Buwana JWT claims — stored in session or buwana_ref_cache_tb
    given_name:       session.given_name      || null,
    first_name:       session.first_name      || null,   // keep for backwards compat
    family_name:      session.family_name     || null,
    last_name:        session.last_name       || null,   // keep for backwards compat
    earthling_emoji:  session.earthling_emoji || null,

    // buwana:profile
    country:          session.country         || null,
    language:         session.language        || null,
    role:             session.role            || null,
    community_id:     session.community_id    || null,

    // buwana:community
    community:        session.community       || null,

    // buwana:bioregion
    continent:          session.continent           || null,
    location_full:      session.location_full       || null,
    watershed_id:       session.watershed_id        || null,
    watershed_name:     session.watershed_name      || null,
    location_watershed: session.location_watershed  || null,
    location_lat:       session.location_lat        || null,
    location_long:      session.location_long       || null,
  }
})
```

---

## 4. Session storage — Persist all new fields at login

When handling the OIDC callback and writing to `req.session`, save all new fields so that
`/api/me` can return them without hitting the DB or Buwana on every request.

```js
// In your OIDC callback / token exchange handler:
req.session.user = {
  ...req.session.user,

  // Fixed claim names
  given_name:      claims.given_name                  ?? null,
  family_name:     claims.family_name ?? claims.last_name ?? null,
  earthling_emoji: claims['buwana:earthlingEmoji']    ?? null,

  // buwana:profile
  country:         claims.country      ?? null,
  language:        claims.language     ?? null,
  role:            claims.role         ?? null,
  community_id:    claims.community_id ?? null,

  // buwana:community  ← bracket notation is critical here
  community:       claims['buwana:community'] ?? null,

  // buwana:bioregion
  continent:          claims.continent          ?? null,
  location_full:      claims.location_full      ?? null,
  watershed_id:       claims.watershed_id       ?? null,
  watershed_name:     claims.watershed_name     ?? null,
  location_watershed: claims.location_watershed ?? null,
  location_lat:       claims.location_lat       ?? null,
  location_long:      claims.location_long      ?? null,
}
```

---

## 5. `buwana_ref_cache_tb` — Add new columns (if you cache Buwana data in the DB)

If you store Buwana profile data in `buwana_ref_cache_tb`, add columns for the new fields.
Without this, a cached row will be missing the new fields even after the user re-logs in
(depending on your cache-invalidation logic).

```sql
ALTER TABLE buwana_ref_cache_tb
  ADD COLUMN IF NOT EXISTS given_name         VARCHAR(120)  NULL,
  ADD COLUMN IF NOT EXISTS family_name        VARCHAR(120)  NULL,
  ADD COLUMN IF NOT EXISTS earthling_emoji    VARCHAR(8)    NULL,
  ADD COLUMN IF NOT EXISTS country            VARCHAR(120)  NULL,
  ADD COLUMN IF NOT EXISTS language           VARCHAR(80)   NULL,
  ADD COLUMN IF NOT EXISTS role               VARCHAR(40)   NULL,
  ADD COLUMN IF NOT EXISTS community_id       INT UNSIGNED  NULL,
  ADD COLUMN IF NOT EXISTS community          VARCHAR(200)  NULL,
  ADD COLUMN IF NOT EXISTS continent          VARCHAR(80)   NULL,
  ADD COLUMN IF NOT EXISTS location_full      VARCHAR(255)  NULL,
  ADD COLUMN IF NOT EXISTS watershed_id       INT UNSIGNED  NULL,
  ADD COLUMN IF NOT EXISTS watershed_name     VARCHAR(200)  NULL,
  ADD COLUMN IF NOT EXISTS location_watershed VARCHAR(200)  NULL,
  ADD COLUMN IF NOT EXISTS location_lat       DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS location_long      DECIMAL(11,8) NULL;
```

Then update your cache-write logic to populate these columns from the JWT claims, using
bracket notation for `buwana:earthlingEmoji` and `buwana:community`.

---

## 6. Scope string in the authorization request

Make sure the authorization redirect URL in your login handler includes all four new scopes:

```js
const params = new URLSearchParams({
  client_id:     BUWANA_CLIENT_ID,
  response_type: 'code',
  redirect_uri:  BUWANA_REDIRECT_URI,
  scope:         'openid buwana:basic buwana:profile buwana:community buwana:bioregion',
  state:         state,
  nonce:         nonce,
})
const loginUrl = `https://buwana.ecobricks.org/authorize?${params}`
```

If any of these scopes are not yet registered for the AirBuddy app in the Buwana App Manager
(Edit Core → Scopes), the `/authorize` endpoint will return `400 invalid_scope` before the
user sees any login page. Confirm all four are registered there first.

---

## Summary of critical fixes (in priority order)

| # | Risk | Change |
|---|------|--------|
| 1 | **HIGH** — silent data loss | Use bracket notation for `claims['buwana:earthlingEmoji']` and `claims['buwana:community']` |
| 2 | **HIGH** — name breaks | Map `given_name → first_name` (keep both in session/response for compatibility) |
| 3 | **MEDIUM** — missing data | Persist + return all bioregion fields from session in `/api/me` |
| 4 | **MEDIUM** — stale cache | Add new columns to `buwana_ref_cache_tb` and update cache-write logic |
| 5 | **LOW** — scope request | Confirm all 4 scopes in the authorization URL and registered in Buwana App Manager |
