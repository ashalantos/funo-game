// ================================================================
// FUNO — Bot AI
// ================================================================
import { G, topCard } from './state.js';
import { isPlayable, giveDraws, drawFromDeck } from './deck.js';
import { WILD_TYPES, VARIETY_TYPES, DRAW_AMOUNTS } from './constants.js';
import { toast, showBotThinking, hideBotThinking } from './ui.js';
import { render } from './renderer.js';
import { botBestColor } from './effects.js';

const BOT_DELAY_MS = 1100;

// Callbacks injected by game.js
let _playCard  = () => {};
let _nextTurn  = () => {};

export function initBot({ playCard, nextTurn }) {
  _playCard = playCard;
  _nextTurn = nextTurn;
}

export function botTurn() {
  hideBotThinking();
  if (G.gamePhase !== 'playing') return;

  const idx = G.currentPlayerIndex;
  const bot = G.players[idx];
  if (!bot || !bot.isBot) return;

  const top = topCard();
  const playableIdxs = bot.hand
    .map((c, i) => (isPlayable(c, top) ? i : -1))
    .filter(i => i >= 0);

  if (playableIdxs.length === 0) {
    _botDraw(idx);
    return;
  }

  const chosen = selectCard(idx, playableIdxs);
  _playCard(idx, chosen);
}

function _botDraw(idx) {
  const bot = G.players[idx];
  if (G.pendingDraws > 0) {
    const amount = G.pendingDraws;
    giveDraws(idx, amount);
    G.pendingDraws      = 0;
    G.mirrorSourceIndex = -1;
    toast(bot.name + ' draws ' + amount + ' card(s)! 😬');
    render();
    _nextTurn();
    return;
  }
  const drawn = drawFromDeck(1);
  bot.hand.push(...drawn);
  toast(bot.name + ' draws a card.');
  render();
  if (drawn.length && isPlayable(drawn[0], topCard())) {
    const drawnIdx = bot.hand.length - 1;
    setTimeout(() => _playCard(idx, drawnIdx), BOT_DELAY_MS * 0.7);
  } else {
    _nextTurn();
  }
}

function selectCard(botIdx, playableIdxs) {
  const bot      = G.players[botIdx];
  const playable = playableIdxs.map(i => ({ i, card: bot.hand[i] }));

  if (G.pendingDraws > 0) {
    const mirror = playable.find(({ card }) => card.type === 'mirror');
    if (mirror) return mirror.i;
    const drawCard = playable.find(({ card }) => DRAW_AMOUNTS[card.type]);
    if (drawCard) return drawCard.i;
  }

  const threatened = G.players.some((p, i) => i !== botIdx && p.hand.length <= 2);
  if (threatened) {
    const atk = playable.filter(({ card }) =>
      ['skip','bomb','draw1','draw2','draw3','draw4','draw5','wild_draw3','wild_draw4','wild_draw5'].includes(card.type)
    );
    if (atk.length) return atk[Math.floor(Math.random() * atk.length)].i;
  }

  if (bot.hand.length >= 8) {
    const chaos = playable.find(({ card }) => card.type === 'chaos');
    if (chaos) return chaos.i;
  }

  const colorNum = playable.filter(({ card }) => card.type === 'number' && card.color === G.currentColor);
  if (colorNum.length) return colorNum[0].i;

  const nums = playable.filter(({ card }) => card.type === 'number');
  if (nums.length) return nums[0].i;

  const colorAction = playable.filter(({ card }) =>
    !WILD_TYPES.has(card.type) && !VARIETY_TYPES.has(card.type) && card.color === G.currentColor
  );
  if (colorAction.length) return colorAction[0].i;

  const action = playable.filter(({ card }) =>
    !WILD_TYPES.has(card.type) && !VARIETY_TYPES.has(card.type)
  );
  if (action.length) return action[0].i;

  const variety = playable.filter(({ card }) => VARIETY_TYPES.has(card.type) && card.type !== 'chaos');
  if (variety.length) return variety[0].i;

  return playable[0].i;
}

export function scheduleBotTurn(name) {
  showBotThinking(name);
  setTimeout(botTurn, BOT_DELAY_MS);
}
