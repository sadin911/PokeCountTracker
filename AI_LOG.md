[2026-08-15 09:47] Major | Antigravity | Write | .gitignore - updated gitignore rules
[2026-08-19 09:47] Major | Antigravity | Write | scripts/download-full-thai-dataset.mjs - downloaded full Thai TCG dataset
[2026-08-19 09:49] Major | Antigravity | Edit | src/data/pokemonNames.json - populated full card fields and images
[2026-08-19 10:08] Major | Antigravity | Delete | scratch/ and data/pokemon-tcg-th/cards/ cleaned up
[2026-08-19 10:08] Major | Antigravity | Edit | src/components/pokemon/HPPresetPicker.tsx - added HP card match
[2026-08-19 10:08] Major | Antigravity | Edit | src/components/mini/MiniPokemonCard.tsx - card display & type
[2026-08-19 10:26] Major | Antigravity | Write | scripts/scrape-official-thai-cards.mjs - scraped 9,554 official Thai cards
[2026-08-19 10:27] Major | Antigravity | Edit | src/data/pokemonNames.json - synced full official dataset (Series H, I, J, Megas)
[2026-08-19 10:29] Major | Antigravity | Write | scripts/download-card-images.mjs - downloaded 9,554 local images
[2026-08-19 10:29] Major | Antigravity | Edit | src/data/pokemonNames.json - linked cards to local public/card-images
[2026-08-19 10:33] Major | Antigravity | Write | scripts/reorganize-and-enrich-cards.mjs - reorganized images by set
[2026-08-19 10:33] Major | Antigravity | Edit | public/card-images - structured into set subfolders [SetCode]/[No]_[Name]
[2026-08-19 10:37] Major | Antigravity | Edit | src/components/pokemon/HPPresetPicker.tsx - added Type/Stage filter & visual grid
[2026-08-19 10:41] Major | Antigravity | Write | src/data/evolutionLines.json - indexed official Thai evolution lines
[2026-08-19 10:42] Major | Antigravity | Write | src/components/pokemon/EvolutionModal.tsx - built 1-tap evolution modal
[2026-08-19 10:42] Major | Antigravity | Edit | src/components/mini/MiniPokemonCard.tsx - added Evolve button & rule handling
[2026-08-19 10:47] Major | Antigravity | Write | src/components/pokemon/CardImagePreviewModal.tsx - high-res card zoom modal
[2026-08-19 10:47] Major | Antigravity | Edit | src/components/pokemon/HPPresetPicker.tsx - added 🔍 card zoom preview
[2026-08-19 10:47] Major | Antigravity | Edit | src/components/pokemon/EvolutionModal.tsx - added 🔍 evolution card zoom
[2026-08-19 10:47] Major | Antigravity | Edit | src/components/mini/MiniPokemonCard.tsx - added 🔍 zoom for active/bench card
[2026-08-19 10:50] Major | Antigravity | Command | git tag v1.5.0 - tagged complete multi-mode version
[2026-08-19 10:51] Major | Antigravity | Delete | src/components/player/PlayerBoard.tsx, CenterDivider.tsx, BenchRow.tsx
[2026-08-19 10:51] Major | Antigravity | Edit | src/components/mini/MiniGameBoard.tsx - integrated theme & fullscreen
[2026-08-19 10:51] Major | Antigravity | Edit | src/components/layout/GameBoard.tsx - streamlined to pure Mini mode
[2026-08-19 10:52] Major | Antigravity | Command | git tag v2.0.0 - tagged consolidated pure Mini Card version
[2026-08-19 10:56] Major | Antigravity | Write | scripts/convert-to-webp.mjs - converted 9,144 PNGs to WebP (-77% size)
[2026-08-19 10:58] Major | Antigravity | Write | scripts/add-official-fallback-urls.mjs - added official CDN fallback
[2026-08-19 11:02] Major | Antigravity | Edit | src/components/pokemon/ - added onError CDN fallback in all image modals
[2026-08-19 11:34] Major | Antigravity | Write | scripts/upload-to-r2.mjs - uploaded 9,144 WebP cards to Cloudflare R2
[2026-08-19 11:47] Major | Antigravity | Command | git push origin main --tags - deployed v1.5.0 & v2.0.0 to GitHub
[2026-08-19 11:51] Major | Antigravity | Fix | .gitignore & src/data/evolutionLines.json - fixed CI build missing file
[2026-08-19 12:02] Major | Antigravity | Edit | src/components/pokemon/HPPresetPicker.tsx - added persistent last-used Energy Type memory
[2026-08-24 14:15] Major | Antigravity | Write | src/components/collection/ - built PokéCollection Tracker with Multi-Profile, Variant tracking, Full-Screen view, and Set Search
[2026-08-24 15:05] Major | Antigravity | Command | git tag v2.1.0 - tagged Collection Tracker release
[2026-08-24 15:45] Major | Antigravity | Write | src/utils/firebase.ts & src/store/authStore.ts - integrated Google Authentication and Cloud Firestore NoSQL Sync
[2026-08-24 15:48] Major | Antigravity | Command | git tag v2.2.0 - tagged Google Auth & Firestore Cloud Sync release
[2026-08-24 15:53] Minor | Antigravity | Fix | public/404.html & index.html - fixed direct URL access (404 error) on GitHub Pages for /collection and /lorcana
[2026-08-24 16:15] Major | Antigravity | Write | src/components/collection/ - added Card Rarity Class filter (Secret Rare, ex, VMAX, VSTAR, V, Promo, Regular)
[2026-08-24 16:26] Major | Antigravity | Write | src/data/pokemonNames.json & src/components/collection/ - separated SAR, AR, SR, UR, EX, VMAX, VSTAR, V, Promo into distinct individual rarity filters
[2026-08-24 16:50] Major | Antigravity | Write | src/components/collection/ - added Full Color viewing toggle mode and smooth interactive hover zoom elevation effect on card tiles
[2026-08-24 16:53] Minor | Antigravity | Write | src/components/collection/CollectionTracker.tsx - added smooth floating 'Back to Top' button
[2026-08-24 16:56] Major | Antigravity | Command | git tag v2.3.0 - tagged Advanced Rarity Filters, Full Color View Mode, Hover Zoom, and Back to Top release
[2026-08-24 17:02] Major | Antigravity | Write | src/components/deck/ & src/store/deckStore.ts - built PokéDeck Builder & Missing Cards Collection Calculator with dedicated URL subpath /deck, multi-deck management, 60-card rules, missing card shopping list, and PTCGL import/export
[2026-08-24 17:03] Major | Antigravity | Command | git tag v2.4.0 - tagged PokéDeck Builder & Missing Cards Calculator release
[2026-08-25 17:58] Major | Antigravity | Edit | src/utils/rarity.ts - fixed SAR/SR/AR/UR rarity classification
[2026-08-25 17:58] Major | Antigravity | Bash | npm run build - build verified successfully
[2026-08-25 18:00] Major | Antigravity | Bash | npm run dev - started dev server at localhost:5173
[2026-08-25 18:02] Major | Antigravity | Git | merged feature/deck-builder into main and pushed
[2026-08-25 18:10] Major | Antigravity | Edit | src/store/collectionStore.ts - persisted collection filter state in store & localStorage
[2026-08-25 18:12] Major | Antigravity | Write | src/components/common/SearchableSetSelect.tsx - built searchable set filter
[2026-08-25 18:15] Major | Antigravity | Edit | src/App.tsx & gameStore.ts - set collection as root default & configured subpaths
[2026-08-25 18:17] Major | Antigravity | Command | git tag v2.5.0 - Searchable Set Filter, Collection Persistence & Subpath Routing
[2026-08-25 18:41] Major | Antigravity | Edit | src/components/ - enhanced prominent close buttons & ESC support in all modals
[2026-08-25 18:42] Major | Antigravity | Command | git tag v2.5.1 - Prominent Modal Controls & Clean Reset Release
[2026-08-25 18:54] Major | Antigravity | Git | checkout -b feature/mobile-ui-enhancement & drafted mobile plan
[2026-08-25 18:59] Major | Antigravity | Write | src/components/ - built mobile BottomNav, quick rarity chips, collapsible filters & Deck tab switcher
[2026-08-25 19:00] Major | Antigravity | Command | git tag v2.6.0 & push - Mobile UI Overhaul Release
[2026-08-25 19:12] Major | Antigravity | Edit | src/components/collection/CollectionFilterBar.tsx - redesigned Vivid Full Color button into high-visibility hero toggle
[2026-08-25 19:14] Major | Antigravity | Command | git tag v2.6.1 & push - High-Visibility Vivid Color Hero Toggle Release
[2026-08-25 19:24] Major | Antigravity | Edit | src/utils/firebase.ts - added explicit local persistence & popup resolver for iOS Safari
[2026-08-26 01:10] Major | Antigravity | Fix | src/components/collection/ - fixed pagination reset on card actions to preserve scroll position
[2026-08-26 01:18] Major | Antigravity | Edit | src/components/collection/CollectionCardItem.tsx - enabled always-visible Quick Add button on Tablet and Mobile
[2026-08-26 01:31] Major | Antigravity | Fix | src/ - resolved Battle & Lorcana board scaling and full height on desktop/tablet
[2026-08-26 01:35] Major | Antigravity | Edit | src/components/mini/MiniGameBoard.tsx - fixed portrait layout ratio for Battle mode
[2026-08-26 01:41] Major | Antigravity | Edit | src/components/mini/MiniPokemonCard.tsx - applied real card aspect ratio (63/88) & enhanced opacity/contrast
[2026-08-26 01:51] Major | Antigravity | Edit | src/components/mini/MiniPokemonCard.tsx - boosted card art to full 90% vivid color with frosted control pills
[2026-08-26 01:57] Major | Antigravity | Command | git tag v2.7.0 & push - Battle & Lorcana Board Scaling, Real Card Ratio (63:88) & Vivid Display Release
[2026-08-26 11:55] Major | Antigravity | Command | git pull --all, download-all-card-images & build verified
[2026-08-26 12:02] Major | Antigravity | Write | src/components/ - added fullscreen card zoom in details & enhanced modal
[2026-08-26 12:03] Major | Antigravity | Command | npm run dev - started dev server at http://localhost:5173/PokeCountTracker/
[2026-08-26 12:07] Major | Antigravity | Write | src/utils/cardImage.ts & scripts/ - separated HD vs thumbnail with sample cards
[2026-08-26 12:11] Major | Antigravity | Command | node scripts/process-and-upload-all-cards.mjs - started dual-res & raw pipeline
[2026-08-26 12:24] Major | Antigravity | Command | 9,553 dual-res cards generated, raw saved locally, uploaded to R2 & build verified
[2026-08-26 12:37] Major | Antigravity | Command | git tag v2.9.0 & push - Fullscreen Ultra-HD Card Preview & Dual-Resolution Architecture Release
[2026-08-26 12:51] Major | Antigravity | Command | node scripts/process-and-upload-hd-jpg.mjs - 9,553 cards converted to full-res JPG 70% & uploaded to R2
[2026-08-26 12:52] Major | Antigravity | Command | git tag v2.9.1 & push - Native 100% Full-Res JPG 70% HD Release
[2026-08-26 13:18] Major | Antigravity | Command | node scripts/sync-storage-clean.mjs - cleaned R2 redundant webp, uploaded HD JPGs
[2026-08-26 13:19] Major | Antigravity | Fix | src/components/ - fixed search filter instant reset on clear & unified single storage
[2026-08-26 13:20] Major | Antigravity | Command | git tag v2.9.2 & push - Clean Single Storage & Search Reset Bugfix Release
[2026-08-26 13:30] Major | Antigravity | Write | src/store/communityStore.ts & src/components/ - added Community Ownership Stats in Card Details & Preview Modal
[2026-08-26 13:41] Major | Antigravity | Fix | src/store/communityStore.ts - guaranteed active user owned cards instantly reflected in stats calculation
[2026-08-26 13:44] Major | Antigravity | Write | src/data/communityStatsDefault.json - created default baseline community stats file
[2026-08-26 14:46] Major | Antigravity | Write | scripts/sync-community-stats-admin.mjs - added Firebase Admin real-user & binder sync script
[2026-08-26 14:54] Major | Antigravity | Command | node scripts/sync-community-stats-admin.mjs - synced 5 real users & 110 owned cards to Firestore & baseline JSON
[2026-08-26 14:56] Major | Antigravity | Command | git tag v2.10.0 & push - Community Card Ownership Stats Release
[2026-08-26 15:17] Major | Antigravity | Fix | src/components/ - removed 'ใบนี้' evolution label & restored 100% vivid card color in details modal
[2026-08-26 15:17] Major | Antigravity | Command | git tag v2.10.1 & push - Clean Evolution Badges & 100% Vivid Modal Card Color Release
[2026-08-27 00:30] Major | Claude | Delete | src/store/lorcanaStore.ts & src/components/lorcana/ - split Disney Lorcana out into its own repo (github.com/sadin911/LorcanaCountTracker); recoverable from commit 129d049 if ever needed here again
[2026-08-27 00:30] Major | Claude | Edit | src/ - removed the 'lorcana' GameMode: gameStore union, App.tsx routing & render branch, BottomNav tab, CollectionHeader/DeckHeader nav buttons, MiniGameBoard switch button, index.css selectors
[2026-08-27 00:30] Minor | Claude | Edit | README.md - dropped the Lorcana sections, pointed at the new repo, corrected the React/TypeScript version badges to match package.json
[2026-08-27 01:35] Major | Claude | Fix | src/store/collectionStore.ts - cleared cards never left Firestore: both write paths now write whole documents instead of setDoc(..., {merge:true}), which could only add or update map keys and never remove them
[2026-08-27 01:35] Major | Claude | Write | src/store/collectionStore.ts - one-time binder migration stamped with schemaVersion 2, prunes entries carrying no information and rewrites each pre-v2 document whole; retries on next sign-in if it fails
[2026-08-27 01:35] Major | Claude | Fix | src/store/collectionStore.ts - deleteProfile checked the last-binder guard after deleting the Firestore doc, wiping your final binder from the cloud while keeping it locally; guard now runs first and the localStorage write moved out of the set() updater
[2026-08-27 01:35] Minor | Claude | Fix | src/store/collectionStore.ts - setCardDetails now prunes, so clearing a note on an unowned card no longer leaves a zeroed entry forever; loadUserFromCloud keeps the selected binder instead of resetting to whichever doc Firestore returned first
[2026-08-27 01:35] Major | Claude | Command | git tag v2.11.0 & push - Lorcana Split & Firestore Card Deletion Fix Release
[2026-08-27 08:26] Major | Antigravity | Write | PWA support - integrated vite-plugin-pwa, icons, manifest & install UI
[2026-08-27 08:27] Major | Antigravity | Command | git tag v2.12.0 & push - Progressive Web App (PWA) & Mobile Install Release
[2026-08-27 09:00] Major | Antigravity | Edit | src/components/deck/ & collection/ - unified CardCollectionModal with Deck support & Missing Cards refill
[2026-08-27 09:06] Major | Antigravity | Write | src/ - added Regulation Mark Series filtering & set grouping across Collection & Deck Builder
[2026-08-27 09:16] Major | Antigravity | Edit | src/data/pokemonNames.json - fixed 353 mismatched regulation marks from official scrape data
[2026-08-27 09:19] Major | Antigravity | Edit | src/ - updated Standard format regulation marks to H, I, J (Standard: H-J)
[2026-08-27 09:23] Major | Antigravity | Edit | src/data/pokemonNames.json - categorized 234 Basic & Special Energy cards from Trainer to Energy
[2026-08-27 09:26] Major | Antigravity | Write | src/components/ - added prominent Category quick chips (Pokemon, Trainer, Energy) & populated Energy card types
[2026-08-27 09:34] Major | Antigravity | Command | git tag v2.13.0 & push - Regulation Mark Series Filter, Data Sanitation & Category Separation Release
[2026-08-27 09:38] Major | Antigravity | Write | SEO & Admin Dashboard - added robots.txt, sitemap, meta tags, schema & Admin Page
[2026-08-27 09:40] Major | Antigravity | Command | git tag v2.14.0 & push - SEO Optimization & Admin Analytics Dashboard Release
[2026-08-27 10:02] Major | Antigravity | Write | Custom Domain - configured poke.tcgcount.com (CNAME, vite root base, sitemap, metadata)
[2026-08-27 10:08] Major | Antigravity | Command | git tag v2.14.1 & push - Custom Domain poke.tcgcount.com Production Release
[2026-08-27 10:55] Major | Antigravity | Command | git tag v2.14.2 & push - Instant Force Redirect & Service Worker Cleanup Release
[2026-08-27 11:38] Major | Antigravity | Fix | src/components/ - positioned Back to Top above BottomNav & safe area on mobile PWA (Collection & Deck)
[2026-08-27 11:38] Major | Antigravity | Command | git tag v2.14.3 & push - Mobile PWA Back to Top Button Fix Release
[2026-08-27 11:41] Major | Antigravity | Edit | src/ - updated Standard regulation filter display label to HIJ (Standard: HIJ)
[2026-08-27 11:42] Major | Antigravity | Command | git tag v2.14.4 & push - Standard Regulation HIJ Label Update Release
[2026-08-27 12:03] Major | Antigravity | Edit | src/components/ - restricted Admin button visibility in user menu to admin emails only
[2026-08-27 12:04] Major | Antigravity | Command | git tag v2.14.5 & push - Admin Menu Button Visibility Restriction Release
[2026-08-27 12:09] Major | Antigravity | Write | feature/pokemon-franchise-theme - applied official Pokemon franchise color palette
[2026-08-27 12:16] Major | Antigravity | Write | src/ - added Pokeball theme with Light, Dark, and Auto system mode switcher
[2026-08-27 12:22] Major | Antigravity | Write | src/ - added Master Ball icon and ultra-bright clean Light Mode styling
[2026-08-27 12:28] Major | Antigravity | Write | src/ - added official booster pack images and zoom preview modal
[2026-08-27 12:32] Major | Antigravity | Write | R2 Sync - uploaded all booster pack images to R2 CDN & added to .gitignore
[2026-08-27 12:35] Major | Antigravity | Edit | src/ - sorted set filter lists by Thai release date descending (Newest first)
[2026-08-27 12:41] Major | Antigravity | Command | git merge & push origin main - Tagged v2.15.0 Release
[2026-08-27 12:50] Major | Antigravity | Write | src/ - added mobile PWA Pull-to-Refresh & filter reset + fixed top safe-area insets
[2026-08-27 14:58] Major | Antigravity | Commit | PokeCountTracker mobile header and filter layout cleanup
[2026-08-27 15:10] Major | Antigravity | Feature | Move Rarity filter to main toolbar as compact dropdown
[2026-08-27 15:21] Major | Antigravity | Fix | Fixed mobile horizontal overflow in Set & Rarity filter bar
[2026-08-27 15:24] Major | Antigravity | Fix | Fixed dropdown z-index stacking above card grid
[2026-08-27 16:30] Major | Antigravity | Fix | Enhanced pull-to-refresh touch detection and responsiveness
[2026-08-27 16:51] Major | Antigravity | Write | e2e/ - built comprehensive Playwright E2E test suites (34 tests)
[2026-08-27 16:54] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 16:56] Major | Antigravity | Command | git push origin main - Deploying latest E2E test suites & mobile PWA fixes
[2026-08-27 17:03] Major | Antigravity | Feature | src/ - added Lorcana-style 3D Holographic / Foil card shimmer & tilt effects
[2026-08-27 17:03] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green with foil tests)
[2026-08-27 17:04] Major | Antigravity | Command | git push origin main - Deploying 3D Holographic Foil Card Effects Release
[2026-08-27 17:11] Major | Antigravity | Fix | src/ - synced exact Lorcana 3D tilt constants & removed blocking hover overlay
[2026-08-27 17:11] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 17:11] Major | Antigravity | Command | git push origin main - Deploying refined natural 3D foil tilt & clear artwork view
[2026-08-27 17:18] Major | Antigravity | Fix | src/ - fixed PWA fullscreen GPU color flickering & added zero-latency touch drag tilt
[2026-08-27 17:18] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 17:18] Major | Antigravity | Command | git push origin main - Deploying PWA fullscreen flicker fix & smooth touch tilt
[2026-08-27 17:25] Major | Antigravity | Feature | src/ - removed static rainbow bars; upgraded to smooth dynamic specular sheen & 60fps physics loop
[2026-08-27 17:25] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 17:25] Major | Antigravity | Command | git push origin main - Deploying clean specular sheen & smooth framerate-controlled 3D tilt
[2026-08-27 17:33] Major | Antigravity | Feature | src/store/collectionStore.ts - set showFullColor=true (Vivid Color mode) as default
[2026-08-27 17:33] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green with pull-to-refresh & color mode)
[2026-08-27 17:33] Major | Antigravity | Command | git push origin main - Deploying Default Color Mode & Pull-To-Refresh Filter Reset
[2026-08-27 17:41] Major | Antigravity | Feature | src/ - 100% exact copy of Lorcana physics constants, useFoilTilt, and modal architecture
[2026-08-27 17:41] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 17:41] Major | Antigravity | Command | git push origin main - Deploying exact Lorcana 3D foil architecture & clean zoom
[2026-08-27 17:46] Major | Antigravity | Refactor | src/ - Fullscreen mode is 100% static clean artwork zoom; 3D tilt is strictly in Detail Modal only
[2026-08-27 17:46] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 17:46] Major | Antigravity | Command | git push origin main - Deploying Lorcana-matched Detail-only 3D Tilt & Pure Static Fullscreen
[2026-08-27 17:50] Major | Antigravity | Fix | src/components/collection/CardCollectionModal.tsx - removed conflicting nested group-hover:scale & duration-300
[2026-08-27 17:50] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 17:50] Major | Antigravity | Command | git push origin main - Deploying nested scale conflict elimination
[2026-08-27 17:56] Major | Antigravity | Refactor | src/ - 100% exact copy of Lorcana DOM hierarchy, grid cols, button wrappers, and color-dodge CSS
[2026-08-27 17:56] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 17:56] Major | Antigravity | Command | git push origin main - Deploying 100% Lorcana layer architecture
[2026-08-27 18:39] Major | Antigravity | Clean | src/data/pokemonNames.json - deduplicated 402 redundant card entries (from 9,643 to 9,241 cards)
[2026-08-27 23:55] Major | Antigravity | Feature | src/store/collectionStore.ts & CollectionHeader.tsx - added dedicated Force Cloud Sync button & handler
[2026-08-27 23:55] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-27 23:55] Major | Antigravity | Command | git push origin main - Deploying Force Cloud Sync feature
[2026-08-28 00:03] Major | Antigravity | Feature | src/hooks/useOTAUpdate.ts, OTAUpdateBanner, OTAUpdateButton - built 1-tap OTA updates
[2026-08-28 00:03] Major | Antigravity | Command | npx playwright test - verified 34 E2E tests passed (100% green)
[2026-08-28 00:03] Major | Antigravity | Command | git push origin main - Deploying Over-The-Air (OTA) Instant App Update System
[2026-08-28 11:20] Major | Antigravity | Write | AGENTS.md, CLAUDE.md - added cross-agent mandatory version tagging rules
[2026-08-28 12:59] Major | Antigravity | Write | CLAUDE.md - expanded full agent operating guide & workflows for Claude Code
[2026-08-28 15:05] Major | Claude | Feature | src/components/layout/AppHeaderBar.tsx, AccountMenu.tsx, HeaderStats.tsx - shared top bar, single account control
[2026-08-28 15:05] Major | Claude | Refactor | CollectionHeader 479 -> 59 lines, DeckHeader 255 -> 52 lines; duplicated toolbar removed
[2026-08-28 15:05] Major | Claude | Refactor | src/index.css - surface/accent tokens replace six per-button colour schemes
[2026-08-28 15:05] Major | Claude | Clean | removed dead PWAInstallButton.tsx; ThemeToggle gains a segmented variant used in the menu
[2026-08-28 15:05] Major | Claude | Write | e2e/top-bar.spec.ts + updated navigation-and-theme.spec.ts for the relocated theme control
[2026-08-28 15:05] Major | Claude | Command | npx oxlint / npm run build / npx playwright test - 0 lint errors, build OK, 48 E2E passed
[2026-08-28 15:20] Major | Claude | Feature | vite.config.ts + AccountMenu - app version injected from package.json, shown on the update row
[2026-08-28 15:20] Major | Claude | Release | package.json 2.15.1 -> 2.16.0
[2026-08-28 15:25] Major | Claude | Release | v2.16.0 - Top bar rebuilt around a single account control; app version visible
[2026-08-28 15:45] Major | Claude | Feature | CollectionFilterBar - Regulation + Category merged into one row of dropdowns (was two scrolling chip rows)
[2026-08-28 15:45] Major | Claude | Write | e2e/collection-tracker.spec.ts - category test now drives the select; adds regulation coverage
[2026-08-28 16:00] Major | Claude | Release | v2.16.1 - Regulation + Category filters folded into one row of dropdowns
[2026-08-28 16:20] Major | Claude | Fix | .github/workflows/deploy.yml - upgraded all actions to their node24 majors, clearing the Node 20 deprecation
[2026-08-28 16:20] Major | Claude | Release | v2.16.2 - CI action upgrade; no application code changed
[2026-08-28 16:05] Major | Claude | Investigate | production data loss - 228-card binder overwritten with an empty one at 08:49Z; recovered via Firestore point-in-time read
[2026-08-28 16:05] Major | Claude | Fix | collectionStore - cloudLoadedUid gate; no cloud write until that account's binders have been read
[2026-08-28 16:05] Major | Claude | Write | vitest + collectionStore.cloudGuard.test.ts - 4 regression tests, confirmed failing before the fix
[2026-08-28 16:15] Major | Claude | Release | v2.16.3 - cloud-write guard; fixes the empty-binder overwrite that caused production data loss
[2026-08-28 16:15] Major | Claude | Recover | restored binder (228 cards / 246 copies) + 2 deleted decks from the 08:48Z point-in-time snapshot; verified byte-identical
[2026-08-28 16:30] Major | Claude | Write | scripts/set-firestore-pitr.mjs - inspect/toggle Firestore point-in-time recovery via the Admin API
[2026-08-28 16:40] Major | Claude | Write | HANDOVER.md - session handover: incident write-up, branch state, outstanding safety work, known traps
[2026-08-28 16:56] Major | Antigravity | Feature | branch feature/deck-equivalent-missing-cards: cross-set card equivalence missing calc
[2026-08-28 16:56] Major | Antigravity | Write | src/utils/deckCalculator.test.ts - 8 unit tests for equivalent missing cards & basic energy
[2026-08-28 16:56] Major | Antigravity | Command | npm test (12 passed), npm run lint (0 errors), npm run build (OK), npx playwright test (48 passed)
[2026-08-28 17:23] Major | Antigravity | Release | v2.17.0 - cross-set equivalent card missing calculation for deck builder
