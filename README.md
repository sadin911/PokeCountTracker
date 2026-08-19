# PokéCount Tracker

A mobile-friendly companion app for **Pokémon TCG** and **Disney Lorcana** tabletop card games. Track HP, damage, lore, and all key game state — right on your phone or tablet, no paper needed.

**Live Demo →** [sadin911.github.io/PokeCountTracker](https://sadin911.github.io/PokeCountTracker/)

---

## Features

### Pokémon TCG Mode

| Feature | Detail |
|---|---|
| **Damage Counters** | +10 / −10 per tap, hold to repeat; quick-add +30 / +60 / +90 |
| **HP Presets** | Common HP values (30–340) plus custom input; resets damage on change |
| **KO Detection** | Slot turns red and shows "KO!" when damage ≥ max HP |
| **Status Conditions** | Poisoned, Burned, Asleep, Paralyzed, Confused — color-coded badges |
| **Energy Tracker** | All 10 energy types with per-type +/− counters |
| **Prize Cards** | 6 dot-tracker per player, tap to update |
| **Supporter Toggle** | Per-turn toggle that auto-resets on End Turn |
| **Ability Tracker** | Per-card Ability + Attack used state, resets each End Turn |
| **Card Swap** | Drag or tap-to-swap any card between Active and Bench slots |
| **Turn System** | End Turn triggers status reminders, applies Poison/Burn damage, flips for Burn/Sleep cures |
| **Display Modes** | Face-to-Face · Same Side · Landscape · Mini (4 views) |

### Disney Lorcana Mode

| Feature | Detail |
|---|---|
| **Lore Counter** | Large 0–20 counter per player with +/− buttons |
| **Inkwell Tracker** | Track ink cards played with +/− counter |
| **Once-per-Turn Ink** | 💧 Ink button marks ink play for the turn; auto-resets on End Turn |
| **Turn System** | End Turn resets ink-played state; turn number tracked |
| **View Toggle** | Face-to-Face (P1 rotated 180°) or Same Side (both normal) |

### Shared Tools

- **Coin Flip** — animated 3D flip, shows Heads or Tails
- **Dice Roller** — animated d6 result
- **Game Reset** — confirm dialog before clearing all state
- **State Persistence** — localStorage keeps your game across page refreshes

---

## Switching Modes

From the **Pokémon board**: tap the **🪄** button in the center bar to enter Lorcana mode.

From the **Lorcana board**: tap **🎮 Pokémon** in the center bar to return.

Each mode saves its state independently — switching modes never loses progress in the other game.

---

## Display Modes (Pokémon)

Switch between views using the **Side** button (or **Exit** from Mini) in the center bar:

| Mode | Best For |
|---|---|
| **Face-to-Face** | Two players sitting across from each other; P1's side rotates 180° |
| **Same Side** | Both players looking at the screen from the same side |
| **Landscape** | Tablet in landscape orientation for a wider field view |
| **Mini** | Compact single-screen view with all slots visible at once |

---

## Screenshots

| Pokémon — Face-to-Face | Lorcana — Face-to-Face | Lorcana — Same Side |
|---|---|---|
| Both active zones face the center divider | P1 rotated 180° at the top | Both panels in normal orientation |

---

## Tech Stack

| | |
|---|---|
| **Framework** | React 18 + Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand with localStorage persistence |
| **Animations** | Framer Motion (coin flip, dice, end-turn modal) |

---

## Running Locally

```bash
git clone https://github.com/sadin911/PokeCountTracker.git
cd PokeCountTracker
npm install
npm run dev
```

Open `http://localhost:5173/PokeCountTracker/` in your browser.

```bash
npm run build   # production build
npm run preview # preview production build locally
```

---

## Project Structure

```
src/
├── components/
│   ├── layout/        # GameBoard, CenterDivider
│   ├── lorcana/       # LorcanaGameBoard, LorcanaPlayerPanel
│   ├── mini/          # MiniGameBoard, MiniPokemonCard
│   ├── mobile/        # Mobile bottom-sheet card detail
│   ├── player/        # PlayerBoard, PlayerHeader, BenchRow, ActiveZone
│   ├── pokemon/       # PokemonSlot, HPBar, DamageCounter, StatusBadge, EnergyTracker
│   └── tools/         # CoinFlip, DiceRoller
├── store/
│   ├── gameStore.ts   # Pokémon game state + display mode + game mode switcher
│   └── lorcanaStore.ts # Lorcana game state (separate persist key)
├── types/
│   └── game.ts        # TypeScript types for all game entities
├── hooks/             # useLongPress, useDragSwap, useTheme, useIsMobile
└── constants/         # HP presets, energy types, status conditions, themes
```

---

## License

MIT
