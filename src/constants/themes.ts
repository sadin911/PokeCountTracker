export type ThemeId = 'midnight' | 'pokemon' | 'mystic';

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  preview: string; // CSS gradient for picker swatch

  // App background (CSS value, used as inline style)
  appBg: string;

  // CenterDivider
  centerBg: string;
  centerBorder: string;
  centerText: string;

  // Bench card
  card: string;
  cardEmpty: string;

  // Active card
  cardActive: string;
  cardActiveEmpty: string;

  // Shared card states
  cardKO: string;
  cardDrag: string;

  // Text inside cards
  cardText: string;
  cardEmptyText: string;
  activeText: string;
  activeEmptyText: string;

  // PlayerHeader
  headerOn: string;
  headerOff: string;
  headerNameOn: string;
  headerNameOff: string;
  headerTurnBadge: string;
  headerDot: string;
  headerDotOff: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌑',
    preview: 'linear-gradient(135deg, #030712 0%, #1e3a5f 100%)',

    appBg: '#030712',
    centerBg: 'bg-gray-900/50',
    centerBorder: 'border-gray-700/50',
    centerText: 'text-gray-500',

    card: 'bg-gray-800/70 border-gray-600 hover:border-gray-500',
    cardEmpty: 'bg-gray-800/30 border-gray-700/50 border-dashed hover:border-gray-600',
    cardActive: 'bg-gray-800/80 border-blue-500/50 ring-1 ring-blue-500/20',
    cardActiveEmpty: 'bg-gray-800/30 border-blue-500/30 border-dashed',
    cardKO: 'bg-red-950/60 border-red-700',
    cardDrag: 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-400',

    cardText: 'text-gray-200',
    cardEmptyText: 'text-gray-600',
    activeText: 'text-blue-200',
    activeEmptyText: 'text-blue-500/60',

    headerOn: 'bg-blue-900/40 border border-blue-600/50',
    headerOff: 'bg-gray-800/50 border border-gray-700/50',
    headerNameOn: 'text-blue-300',
    headerNameOff: 'text-gray-300',
    headerTurnBadge: 'text-blue-400',
    headerDot: 'bg-blue-400',
    headerDotOff: 'bg-gray-600',
  },

  pokemon: {
    id: 'pokemon',
    name: 'Pokémon',
    emoji: '⚡',
    preview: 'linear-gradient(135deg, #1565C0 0%, #FFCB05 100%)',

    appBg: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 45%, #0D47A1 100%)',
    centerBg: 'bg-sky-800/70',
    centerBorder: 'border-yellow-500/40',
    centerText: 'text-sky-300',

    card: 'bg-sky-900/65 border-sky-500/40 hover:border-sky-300/60',
    cardEmpty: 'bg-sky-950/40 border-sky-600/30 border-dashed hover:border-sky-400/50',
    cardActive: 'bg-yellow-900/55 border-yellow-400/65 ring-1 ring-yellow-400/25',
    cardActiveEmpty: 'bg-yellow-950/30 border-yellow-600/30 border-dashed',
    cardKO: 'bg-red-950/70 border-red-500',
    cardDrag: 'bg-sky-700/55 border-sky-200 ring-2 ring-sky-200',

    cardText: 'text-sky-100',
    cardEmptyText: 'text-sky-500/70',
    activeText: 'text-yellow-200',
    activeEmptyText: 'text-yellow-500/60',

    headerOn: 'bg-yellow-900/55 border border-yellow-500/55',
    headerOff: 'bg-sky-900/55 border border-sky-700/50',
    headerNameOn: 'text-yellow-300',
    headerNameOff: 'text-sky-200',
    headerTurnBadge: 'text-yellow-400',
    headerDot: 'bg-yellow-400',
    headerDotOff: 'bg-sky-700',
  },

  mystic: {
    id: 'mystic',
    name: 'Mystic',
    emoji: '🔮',
    preview: 'linear-gradient(135deg, #0D0820 0%, #7C3AED 100%)',

    appBg: 'linear-gradient(180deg, #0D0820 0%, #180A38 50%, #0D0820 100%)',
    centerBg: 'bg-violet-950/60',
    centerBorder: 'border-violet-600/40',
    centerText: 'text-violet-400',

    card: 'bg-violet-950/65 border-violet-500/40 hover:border-violet-400/65',
    cardEmpty: 'bg-violet-950/30 border-violet-600/30 border-dashed hover:border-violet-500/45',
    cardActive: 'bg-fuchsia-950/60 border-fuchsia-400/65 ring-1 ring-fuchsia-400/20',
    cardActiveEmpty: 'bg-fuchsia-950/25 border-fuchsia-600/30 border-dashed',
    cardKO: 'bg-red-950/70 border-red-500',
    cardDrag: 'bg-violet-700/45 border-violet-300 ring-2 ring-violet-300',

    cardText: 'text-violet-100',
    cardEmptyText: 'text-violet-600/70',
    activeText: 'text-fuchsia-200',
    activeEmptyText: 'text-fuchsia-500/60',

    headerOn: 'bg-fuchsia-950/55 border border-fuchsia-500/55',
    headerOff: 'bg-violet-950/55 border border-violet-700/50',
    headerNameOn: 'text-fuchsia-300',
    headerNameOff: 'text-violet-200',
    headerTurnBadge: 'text-fuchsia-400',
    headerDot: 'bg-fuchsia-400',
    headerDotOff: 'bg-violet-800',
  },
};

export const THEME_ORDER: ThemeId[] = ['midnight', 'pokemon', 'mystic'];
