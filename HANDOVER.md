# Handover — 2026-08-28

State of the project at the end of the Claude Code session on 2026-08-28, written for
whoever picks this up next.

`main` is at **v2.16.3**, deployed and verified live at https://poke.tcgcount.com.

---

## 1. Production incident — resolved, but read this first

A user's binder lost **228 cards**, and two of their three decks were deleted.

**What happened.** `syncProfileToCloud` writes a binder as a *whole document* — deliberately,
because a merge cannot remove cards the user cleared. It guarded only on `auth.currentUser`
being set. On boot:

1. `onAuthStateChanged` fires with `null`, so `resetToGuest()` loads the empty guest binder.
2. Firebase restores the session and `auth.currentUser` becomes truthy.
3. `loadUserFromCloud()` starts fetching the real binders over the network.

Between 2 and 3 completing, the user looks signed in while the store still holds the empty
guest binder. Any edit in that window scheduled a whole-document write of the *empty* binder
over the real one.

**What made it fire that day.** Three deploys inside 45 minutes had users reloading the PWA
repeatedly, re-running that window each time, while the owner was actively tapping around the
collection page to test a new UI.

**The fix (v2.16.3).** The store now tracks `cloudLoadedUid` — the account whose binders have
actually been read into memory. `syncProfileToCloud` and `forceSyncCloud` refuse to write
unless it matches the signed-in uid; `resetToGuest` clears it so a transient auth blip cannot
leave the gate open. Guest mode never reached this path and is unchanged.

**Recovery.** Firestore keeps ~1 hour of document versions even without PITR. The data was
read back at a timestamp before the overwrite and restored — verified byte-identical, card by
card. Snapshots are in `data/firestore-recovery/` (gitignored — they contain user data, do not
commit them). `scripts/restore-binder-from-snapshot.mjs` performs the restore; it reads live
state first, skips anything that already matches, and is safe to re-run.

**Lesson worth keeping.** Recovery depended on two pieces of luck: the owner noticed within
minutes, and Firestore happened to retain an hour. Neither is a control. That is what the
remaining work in §4 is for.

---

## 2. Where things stand

### `main` — v2.16.3, deployed

Recent releases:

| Version | What |
| --- | --- |
| v2.16.0 | Top bar rebuilt around a single account control; app version now visible |
| v2.16.1 | Regulation + Category filters folded into one row of dropdowns |
| v2.16.2 | Pages workflow moved onto node24 actions |
| v2.16.3 | Cloud-write guard (the incident fix) + Vitest |

### Quality gates — all four are mandatory before any merge to `main`

```bash
npm run lint          # oxlint, must be 0 errors
npm run build         # tsc -b && vite build
npm test              # Vitest — store logic, incl. the cloud-write guard
npx playwright test   # 48 E2E across chromium + mobile
```

`npm test` is new as of v2.16.3. Vitest was added because this bug class is invisible to the
E2E suite — it needs auth and Firestore, which the browser tests do not have. That absence is
part of why the bug reached production. Do not skip it.

### Deploy

Pushing to `main` triggers GitHub Pages. Two things learned the hard way:

- **Push once.** The workflow uses `concurrency: cancel-in-progress`. Two pushes in quick
  succession cancel the first run. Bump the version and write the AI_LOG entry on the branch
  *before* merging, so `main` takes a single push.
- **Match the run to the commit.** `gh run list --limit 1` can return the *previous* run if the
  new one has not registered yet. Filter by `headSha`:
  ```bash
  SHA=$(git rev-parse HEAD)
  gh run list --workflow=deploy.yml --limit 5 --json databaseId,headSha \
    --jq ".[] | select(.headSha==\"$SHA\") | .databaseId"
  ```
- **Verify the live site, not just the green check.** Fetch the deployed bundle and grep for
  something the change actually introduced.

---

## 3. Two paused branches

Both were cut from `main` *before* the header rewrite, so both need `main` merged in first, and
both need a version bump to **2.17.0** (2.16.x is used up).

### `feature/card-pricing-and-market-valuation`

Market pricing, portfolio valuation, cost/profit tracking, graded slabs, 1-click market search
links, deck valuation, related-card strips. Gates were green when it was parked.

**Rarity-based price estimates are deliberately switched off** (`PRICE_ESTIMATES_ENABLED = false`
in `pricingStore.ts`). The estimator only knew rarity, category and set era, so every SAR in a
set showed the same price — it never identified the actual card, which the owner correctly
rejected. Do not turn it back on without real per-card data.

**It will conflict with `CollectionHeader.tsx`.** That file went from 479 lines to 59 in the
header rewrite. The branch adds a currency selector and a 💰 portfolio badge to the old
structure. Do not resolve this line by line — move those controls into the new
`contextSlot` / `AccountMenu` structure instead.

**On sourcing real prices** (measured, not guessed):

| Source | Finding |
| --- | --- |
| TCGdex `ja` | 41.0% of the 9,241 cards resolve. Missing the newest sets entirely (SV10s, SV11s, MA1–MA5). |
| TCGdex `th` | 31.6%. Many Thai sets have set metadata but *no card data at all*. |
| **TCGCSV** (`tcgcsv.com`, category 85) | **456 JP sets vs TCGdex's 184.** Real TCGplayer USD prices per variant, plus Number/Rarity/HP/Stage. Also has EN Pokémon (category 3), which is the only route to an EN benchmark — TCGdex returned `tcgplayer: null` on all 55 cards sampled. Requires a `User-Agent` header or node fetch gets 401. |

TCGCSV is the better source. The remaining work there is the join:

- Thai sets that map 1:1 to a JP set match perfectly by collector number (verified: `Sv8a`
  237/237).
- Thai sets that merge or renumber JP sets (SV11s, MA1, SV10s) need per-card matching. An
  offset rule was tested and **failed** (3–4% — Thai reorders rather than concatenating).
  Name + HP matching got 15–42%, held back by holo-pattern variants appearing as separate
  TCGCSV products and by a weak Thai→EN dictionary.

### `feature/thai-japanese-card-name-map`

Generated Thai↔Japanese name map plus the resolver that reads it. **82.9% of the 9,241 cards
resolve to a Japanese name** (71.8% exact, from a shared TCGdex card id; 11.0% derived via the
National Dex). 93% of Pokémon, 48% of Trainers, 16% of Energy.

`src/utils/cardNames.ts` handles the three quirks that defeated the previous lookup: suffixes
written flush against the name (`ฟุชิกิบานะex`), bracketed role tags
(`คำเชิญของเอริกะ[ซัพพอร์ต]`), and regional prefixes with doubled spaces (`กาลาร์  โพนีตะ`).

Rebuild with `npm run data:name-map` (cached) or `--refresh`. Coverage report:
`npm run data:name-map:report`.

The remaining gap is Trainers, Items and Energy, which have no Dex identity to fall back on.
Closing it means pulling names from TCGdex `ja` by card id directly rather than via the
English dictionary.

---

## 4. Outstanding safety work

Ordered by value per unit of effort.

1. **Delete protection — not yet enabled.** `scripts/set-firestore-pitr.mjs
   --enable-delete-protection` returns 403: the Firebase Admin SDK service account can read
   database settings but lacks `datastore.databases.update`. Do it in Google Cloud Console →
   Firestore → Databases → (default) → Edit, or grant the service account
   `roles/datastore.owner`. It is free.

2. **Revision history — designed, not built.** On each binder write, also write a copy to
   `users/{uid}/binders/{id}/revisions/{timestamp}`, keeping the last 10. Recovers without
   depending on Google's retention window, and could be surfaced in-app so a user can roll
   back themselves. Cost is roughly double the writes; the binder is ~60 KiB so storage is
   negligible. An alternative — only snapshot when the card count drops sharply — was
   considered and is *not* recommended: it guesses at intent, and a user who genuinely clears
   a binder then has no history.

3. **Soft delete — considered, deprioritised.** It would not have helped here: nothing was
   deleted, the `cards` field was overwritten with `{}`. If wanted, apply it only to deleting a
   whole binder (`collectionStore.ts:302`), which is the genuinely destructive operation.

**Already done:** PITR is enabled (7-day window, growing to full depth over the week — it is
not retroactive). The cloud-write guard is live. Four regression tests cover it.

---

## 5. Things that will bite you

- **`CLAUDE.md` describes a Pokémon energy-type theme engine that does not exist.**
  `themeStore.ts` supports `light | dark | system` only. The header work introduced its own
  accent tokens in `index.css` instead. `CLAUDE.md` should be corrected.
- **Playwright must not run on port 5173.** That is Vite's default and gets claimed by whichever
  project is open — a test run once silently asserted against a completely different app. The
  config now pins 5174.
- **`/data/` is gitignored** and holds the Firestore recovery snapshots plus API caches. It
  contains real user data. Keep it out of git.
- **The service account JSON in the project root is gitignored** (`*-adminsdk-*.json`). Keep it
  that way.
- **`gh` stores its token in the macOS keyring**, not `~/.config/gh/hosts.yml`. Checking for
  that file to decide whether someone is logged in gives the wrong answer.

---

## 6. Useful commands

```bash
# Firestore safety settings (read-only without a flag)
node scripts/set-firestore-pitr.mjs

# Restore a binder from a point-in-time snapshot (dry run without --commit)
node scripts/restore-binder-from-snapshot.mjs

# Thai↔Japanese name map
npm run data:name-map
npm run data:name-map:report
```

Cross-agent activity log: `AI_LOG.md`. Design spec for the header work:
`docs/superpowers/specs/2026-08-28-top-bar-toolbar-design.md`.
