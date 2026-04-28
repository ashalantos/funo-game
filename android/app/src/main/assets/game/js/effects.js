// ================================================================
// FUNO — Card Effects
// Receives callback functions from game.js to avoid circular deps.
// ================================================================
import { G, topCard } from './state.js';
import { giveDraws, drawFromDeck, isPlayable, shuffle } from './deck.js';
import { WILD_TYPES, VARIETY_TYPES, DRAW_AMOUNTS, COLOR_DATA } from './constants.js';
import { toast, showColorPicker, showSwapPicker, playSound } from './ui.js';
import { render } from './renderer.js';

// Callbacks injected by game.js
let _nextTurn           = () => {};
let _getNextPlayerIndex = (i) => i;
let _getPrevPlayerIndex = (i) => i;
let _playCard           = () => {};

export function initEffects({ nextTurn, getNextPlayerIndex, getPrevPlayerIndex, playCard }) {
  _nextTurn           = nextTurn;
  _getNextPlayerIndex = getNextPlayerIndex;
  _getPrevPlayerIndex = getPrevPlayerIndex;
  _playCard           = playCard;
}

export function applyEffect(card, playerIndex) {
  const type = card.type;

  if (WILD_TYPES.has(type)) {
    if (DRAW_AMOUNTS[type]) G.pendingDraws += DRAW_AMOUNTS[type];
    if (playerIndex === 0) {
      G.waitingForModal = true;
      showColorPicker((chosenColor) => {
        G.currentColor    = chosenColor;
        G.waitingForModal = false;
        toast('🎨 Color changed to ' + COLOR_DATA[chosenColor].label + '!');
        render();
        _nextTurn();
      });
    } else {
      G.currentColor = botBestColor(playerIndex);
      toast(G.players[playerIndex].name + ' chose ' + COLOR_DATA[G.currentColor].label + '!');
      render();
      _nextTurn();
    }
    return;
  }

  if (type === 'skip') {
    const skipped = _getNextPlayerIndex(playerIndex);
    toast('🚫 ' + G.players[skipped].name + ' is skipped!');
    G.currentPlayerIndex = skipped;
    _nextTurn();
    return;
  }

  if (type === 'reverse') {
    G.direction *= -1;
    toast('↩️ Direction reversed!');
    // In 2-player, reverse acts as skip: place index on "next" (opponent)
    // so the subsequent nextTurn() lands back on the player who reversed
    if (G.players.length === 2) {
      G.currentPlayerIndex = _getNextPlayerIndex(playerIndex);
    }
    render();
    _nextTurn();
    return;
  }

  if (DRAW_AMOUNTS[type] && !WILD_TYPES.has(type)) {
    G.pendingDraws      += DRAW_AMOUNTS[type];
    G.mirrorSourceIndex  = playerIndex;
    render();
    _nextTurn();
    return;
  }

  if (type === 'swap') {
    if (playerIndex === 0) {
      G.waitingForModal = true;
      showSwapPicker(playerIndex, (targetIndex) => {
        doSwap(playerIndex, targetIndex);
        G.waitingForModal = false;
        render();
        _nextTurn();
      });
    } else {
      botDoSwap(playerIndex);
      render();
      _nextTurn();
    }
    return;
  }

  if (type === 'bomb') {
    G.players.forEach((_, i) => { if (i !== playerIndex) giveDraws(i, 2); });
    toast('💣 BOMB! Everyone else draws 2!');
    playSound('special');
    render();
    _nextTurn();
    return;
  }

  if (type === 'lucky') {
    luckyDraw(_getNextPlayerIndex(playerIndex));
    return;
  }

  if (type === 'mirror') {
    const from   = G.mirrorSourceIndex >= 0 ? G.mirrorSourceIndex : _getPrevPlayerIndex(playerIndex);
    const amount = G.pendingDraws;
    G.pendingDraws      = 0;
    G.mirrorSourceIndex = -1;
    giveDraws(from, amount);
    toast('🪞 MIRROR! ' + G.players[from].name + ' takes back +' + amount + '!');
    playSound('special');
    render();
    _nextTurn();
    return;
  }

  if (type === 'chaos') {
    doChaos();
    render();
    _nextTurn();
    return;
  }

  _nextTurn();
}

function luckyDraw(targetIdx) {
  const player = G.players[targetIdx];
  const top    = topCard();
  let drawn    = 0;
  let foundIdx = -1;
  const MAX    = 20;
  while (foundIdx < 0 && drawn < MAX) {
    const cards = drawFromDeck(1);
    if (!cards.length) break;
    drawn++;
    player.hand.push(...cards);
    if (isPlayable(cards[0], top)) foundIdx = player.hand.length - 1;
  }
  render();
  if (foundIdx >= 0) {
    const found = player.hand[foundIdx];
    toast('🍀 LUCKY! ' + player.name + ' drew ' + drawn + ' & plays ' + (found.type === 'number' ? found.value : found.type) + '!');
    setTimeout(() => _playCard(targetIdx, foundIdx), 700);
  } else {
    toast('🍀 LUCKY! ' + player.name + ' drew ' + drawn + ' cards.');
    _nextTurn();
  }
}

function doSwap(a, b) {
  const tmp = G.players[a].hand;
  G.players[a].hand = G.players[b].hand;
  G.players[b].hand = tmp;
  toast('↔️ ' + G.players[a].name + ' swapped hands with ' + G.players[b].name + '!');
}

function botDoSwap(botIdx) {
  let minCards = Infinity, target = -1;
  G.players.forEach((p, i) => {
    if (i !== botIdx && p.hand.length < minCards) { minCards = p.hand.length; target = i; }
  });
  if (target >= 0) doSwap(botIdx, target);
}

function doChaos() {
  let pool = [];
  G.players.forEach(p => { pool.push(...p.hand); p.hand = []; });
  shuffle(pool);
  const each = Math.floor(pool.length / G.players.length);
  G.players.forEach(p => { p.hand = pool.splice(0, each); });
  let i = 0;
  while (pool.length) G.players[i++ % G.players.length].hand.push(pool.pop());
  toast('🌀 CHAOS! All hands shuffled and redistributed!');
  playSound('special');
}

export function botBestColor(botIdx) {
  const freq = {};
  G.activeColors.forEach(c => { freq[c] = 0; });
  G.players[botIdx].hand.forEach(c => { if (c.color) freq[c.color] = (freq[c.color] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || G.activeColors[0];
}
