// ================================================================
// FUNO — Constants
// ================================================================

export const COLOR_DATA = {
  red:    { label: 'Red',    hex: '#e74c3c' },
  blue:   { label: 'Blue',   hex: '#2980b9' },
  green:  { label: 'Green',  hex: '#27ae60' },
  yellow: { label: 'Yellow', hex: '#f1c40f' },
  purple: { label: 'Purple', hex: '#8e44ad' },
  orange: { label: 'Orange', hex: '#e67e22' },
  pink:   { label: 'Pink',   hex: '#e91e8c' },
  teal:   { label: 'Teal',   hex: '#16a085' },
};

export const ALL_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'teal'];

// Cards that add to pending draw counter
export const DRAW_AMOUNTS = {
  draw1: 1, draw2: 2, draw3: 3, draw4: 4, draw5: 5,
  wild_draw3: 3, wild_draw4: 4, wild_draw5: 5,
};

// Types that are wild (need color selection)
export const WILD_TYPES = new Set(['wild', 'wild_draw3', 'wild_draw4', 'wild_draw5']);

// Types that are the 5 special variety cards
export const VARIETY_TYPES = new Set(['swap', 'bomb', 'lucky', 'mirror', 'chaos']);

// All non-number card types
export const ACTION_TYPES = new Set([
  'skip', 'reverse',
  'draw1', 'draw2', 'draw3', 'draw4', 'draw5',
  'wild', 'wild_draw3', 'wild_draw4', 'wild_draw5',
  'swap', 'bomb', 'lucky', 'mirror', 'chaos',
]);

// Display symbols
export const SYMBOL = {
  skip:       '🚫',
  reverse:    '↩️',
  draw1:      '+1',
  draw2:      '+2',
  draw3:      '+3',
  draw4:      '+4',
  draw5:      '+5',
  wild:       '🌈',
  wild_draw3: '🌈+3',
  wild_draw4: '🌈+4',
  wild_draw5: '🌈+5',
  swap:       '↔️',
  bomb:       '💣',
  lucky:      '🍀',
  mirror:     '🪞',
  chaos:      '🌀',
};

// Score value for non-number cards
export const CARD_POINTS = {
  skip: 20, reverse: 20,
  draw1: 10, draw2: 20, draw3: 30, draw4: 40, draw5: 50,
  wild: 50, wild_draw3: 60, wild_draw4: 70, wild_draw5: 80,
  swap: 40, bomb: 40, lucky: 40, mirror: 40, chaos: 60,
};
