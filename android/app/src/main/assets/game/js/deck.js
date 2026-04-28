// ================================================================
// FUNO — Deck builder & card utilities
// ================================================================
import { G, nextCardId } from './state.js';
import { WILD_TYPES, VARIETY_TYPES, DRAW_AMOUNTS } from './constants.js';

let _toast = (msg) => {};
export function initDeck({ toast }) { _toast = toast; }

export function makeCard(type, color, value) {
  color = color === undefined ? null : color;
  value = value === undefined ? null : value;
  return { id: nextCardId(), type, color, value };
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

export function buildDeck() {
  const { settings, activeColors } = G;
  const maxN = settings.maxNumber;
  const deck = [];

  activeColors.forEach(c => {
    deck.push(makeCard('number', c, 0));
    for (let n = 1; n <= maxN; n++) {
      deck.push(makeCard('number', c, n));
      deck.push(makeCard('number', c, n));
    }
    deck.push(makeCard('skip', c));
    deck.push(makeCard('skip', c));
    deck.push(makeCard('reverse', c));
    deck.push(makeCard('reverse', c));
    if (settings.drawCards.includes('draw1')) { deck.push(makeCard('draw1', c)); deck.push(makeCard('draw1', c)); }
    if (settings.drawCards.includes('draw2')) { deck.push(makeCard('draw2', c)); deck.push(makeCard('draw2', c)); }
  });

  for (let i = 0; i < 4; i++) deck.push(makeCard('wild', null));
  if (settings.drawCards.includes('draw3')) { for (let i=0;i<4;i++) deck.push(makeCard('wild_draw3', null)); }
  if (settings.drawCards.includes('draw4')) { for (let i=0;i<4;i++) deck.push(makeCard('wild_draw4', null)); }
  if (settings.drawCards.includes('draw5')) { for (let i=0;i<4;i++) deck.push(makeCard('wild_draw5', null)); }

  settings.varietyCards.forEach(v => {
    deck.push(makeCard(v, null));
    deck.push(makeCard(v, null));
  });

  return shuffle(deck);
}

export function drawFromDeck(count) {
  count = count || 1;
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (G.deck.length === 0) reshuffleDeck();
    if (G.deck.length === 0) break;
    drawn.push(G.deck.pop());
  }
  return drawn;
}

function reshuffleDeck() {
  if (G.discardPile.length <= 1) return;
  const top = G.discardPile.pop();
  G.deck = shuffle([].concat(G.discardPile));
  G.discardPile = [top];
  _toast('♻️ Deck reshuffled from discard!');
}

export function giveDraws(playerIndex, count) {
  const cards = drawFromDeck(count);
  G.players[playerIndex].hand.push.apply(G.players[playerIndex].hand, cards);
  return cards.length;
}

export function isPlayable(card, top) {
  if (!top) return true;
  if (card.type === 'mirror') return G.pendingDraws > 0;
  if (G.pendingDraws > 0) return !!DRAW_AMOUNTS[card.type];
  if (WILD_TYPES.has(card.type)) return true;
  if (VARIETY_TYPES.has(card.type)) return true;
  if (card.color && card.color === G.currentColor) return true;
  if (card.type === top.type) return true;
  if (card.type === 'number' && top.type === 'number' && card.value === top.value) return true;
  return false;
}
