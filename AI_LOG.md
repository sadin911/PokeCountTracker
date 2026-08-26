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
