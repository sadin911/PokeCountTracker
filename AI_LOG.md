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
