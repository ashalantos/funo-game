// ================================================================
// FUNO — Game Controller
// ================================================================
import { G, topCard, createFreshState } from './state.js';
import { buildDeck, drawFromDeck, isPlayable, giveDraws, initDeck } from './deck.js';
import { ALL_COLORS, CARD_POINTS } from './constants.js';
import { render, initRenderer } from './renderer.js';
import { applyEffect, initEffects } from './effects.js';
import { scheduleBotTurn, initBot } from './bot.js';
import { toast, launchConfetti, stopConfetti, playSound, hideBotThinking } from './ui.js';

// Wire dependency injection (break circular deps)
initDeck({ toast });
initRenderer({ onHumanPlayCard });
initEffects({ nextTurn, getNextPlayerIndex, getPrevPlayerIndex, playCard });
initBot({ playCard, nextTurn });

// ── Start game ────────────────────────────────────────────────────
export function startGame(settings) {
  stopConfetti();
  hideBotThinking();

  // Reset entire state
  const fresh = createFreshState();
  Object.assign(G, fresh);
  G.settings     = settings;
  G.activeColors = ALL_COLORS.slice(0, settings.numColors);
  G.gamePhase    = 'playing';

  // Build players
  for (let i = 0; i < settings.numPlayers; i++) {
    G.players.push({
      name:      i === 0 ? settings.playerName : ('Bot ' + i),
      hand:      [],
      isBot:     i > 0,
      calledUno: false,
    });
  }

  // Build & deal
  G.deck = buildDeck();
  G.players.forEach(p => { p.hand.push(...drawFromDeck(7)); });

  // First card must be a number
  let firstCard = null;
  for (let attempts = 0; attempts < G.deck.length; attempts++) {
    const candidate = G.deck.pop();
    if (candidate.type === 'number') { firstCard = candidate; break; }
    G.deck.unshift(candidate);
  }
  if (!firstCard) firstCard = G.deck.pop();

  G.discardPile.push(firstCard);
  G.currentColor = firstCard.color;

  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  render();

  if (G.players[0].isBot) scheduleBotTurn(G.players[0].name);
}

// ── Play a card ────────────────────────────────────────────────────
export function playCard(playerIndex, cardIndex) {
  if (G.gamePhase !== 'playing') return;
  if (G.blocked) return;
  G.blocked = true;

  const player = G.players[playerIndex];
  if (cardIndex < 0 || cardIndex >= player.hand.length) { G.blocked = false; return; }

  const card = player.hand.splice(cardIndex, 1)[0];
  if (card.color) G.currentColor = card.color;
  G.discardPile.push(card);
  playSound('play');
  render();

  // Win check
  if (player.hand.length === 0) {
    G.blocked = false;
    endGame(playerIndex);
    return;
  }

  // UNO penalty for human who forgot
  if (playerIndex === 0 && player.hand.length === 1 && !player.calledUno) {
    if (Math.random() < 0.55) {
      setTimeout(() => {
        toast('⚠️ Caught! Forgot UNO — draw 2!');
        giveDraws(0, 2);
        render();
      }, 700);
    }
  }

  // Bot auto-UNO
  if (player.isBot && player.hand.length === 1) {
    player.calledUno = true;
    setTimeout(() => toast(player.name + ': UNO! 🎉'), 400);
  }

  G.blocked = false;
  applyEffect(card, playerIndex);
}

// ── Human draws ───────────────────────────────────────────────────
export function humanDraw() {
  if (G.currentPlayerIndex !== 0) return;
  if (G.blocked || G.waitingForModal || G.gamePhase !== 'playing') return;

  if (G.pendingDraws > 0) {
    const amount        = G.pendingDraws;
    G.pendingDraws      = 0;
    G.mirrorSourceIndex = -1;
    giveDraws(0, amount);
    toast('You drew ' + amount + ' card(s)! 😬');
    playSound('draw');
    render();
    nextTurn();
    return;
  }

  const drawn = drawFromDeck(1);
  G.players[0].hand.push(...drawn);
  playSound('draw');
  toast('You drew a card.');
  render();

  if (drawn.length && isPlayable(drawn[0], topCard())) {
    toast('✨ Drawn card is playable — click it to play!');
  } else {
    nextTurn();
  }
}

// ── Call UNO ─────────────────────────────────────────────────────
export function callUno() {
  G.players[0].calledUno = true;
  toast('UNO! 🎉');
  playSound('uno');
  document.getElementById('uno-btn').classList.remove('urgent');
}

// ── Next turn ─────────────────────────────────────────────────────
export function nextTurn() {
  G.blocked = false;
  G.currentPlayerIndex = getNextPlayerIndex(G.currentPlayerIndex);
  render();
  if (G.gamePhase !== 'playing') return;
  const cur = G.players[G.currentPlayerIndex];
  if (cur.isBot) scheduleBotTurn(cur.name);
}

// ── Index helpers ─────────────────────────────────────────────────
export function getNextPlayerIndex(from) {
  return (from + G.direction + G.players.length) % G.players.length;
}
export function getPrevPlayerIndex(from) {
  return (from - G.direction + G.players.length) % G.players.length;
}

// ── Human card click callback (injected into renderer) ────────────
export function onHumanPlayCard(cardIndex) {
  if (G.currentPlayerIndex !== 0 || G.blocked || G.waitingForModal) return;
  playCard(0, cardIndex);
}

// ── End game ──────────────────────────────────────────────────────
export function endGame(winnerIdx) {
  G.gamePhase = 'gameover';
  G.blocked   = true;
  hideBotThinking();

  const list = document.getElementById('scores-list');
  list.innerHTML = '';
  G.players.forEach((p, i) => {
    const pts = p.hand.reduce((s, c) => s + (c.type === 'number' ? (c.value || 0) : (CARD_POINTS[c.type] || 20)), 0);
    const li  = document.createElement('li');
    li.innerHTML =
      '<span class="' + (i === winnerIdx ? 'score-win' : '') + '">' +
      (i === winnerIdx ? '🏆 ' : '') + p.name +
      '</span><span>' + pts + ' pts (' + p.hand.length + ' left)</span>';
    list.appendChild(li);
  });

  document.getElementById('winner-name').textContent = G.players[winnerIdx].name;
  document.getElementById('gameover-modal').classList.remove('hidden');
  launchConfetti();
  playSound('win');

  // 📱 Android bridge: trigger interstitial ad between rounds
  if (window.FunoApp) {
    window.FunoApp.onGameOver(G.players[winnerIdx].name);
  }
}

// ── Rewarded ad callback (called by Android after video watched) ──
window.onRewardGranted = function(amount) {
  if (G.gamePhase !== 'playing') return;
  const cards = amount || 3;
  giveDraws(0, cards);
  toast('🎁 Reward! You drew ' + cards + ' bonus card(s)!');
  render();
};

// ── Go to setup ───────────────────────────────────────────────────
export function goToSetup() {
  stopConfetti();
  hideBotThinking();
  document.getElementById('gameover-modal').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.remove('hidden');
}

