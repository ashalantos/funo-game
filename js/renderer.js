// ================================================================
// FUNO — Renderer
// ================================================================
import { G, topCard } from './state.js';
import { isPlayable } from './deck.js';
import { COLOR_DATA, WILD_TYPES, VARIETY_TYPES, SYMBOL } from './constants.js';

// Callback injected by game.js so renderer does not import game.js
let _onHumanPlayCard = () => {};
export function initRenderer({ onHumanPlayCard }) {
  _onHumanPlayCard = onHumanPlayCard;
}

export function render() {
  renderOpponents();
  renderDiscard();
  renderPlayerHand();
  renderDeckCount();
  renderColorDot();
  renderDirection();
  renderDrawStack();
  renderTurnLabel();
}

export function renderOpponents() {
  const area = document.getElementById('opponents-area');
  area.innerHTML = '';
  G.players.forEach((p, i) => {
    if (i === 0) return;
    const isActive = i === G.currentPlayerIndex;
    const slot = document.createElement('div');
    slot.className = 'opponent-slot' + (isActive ? ' active-turn' : '');
    slot.id = 'opp-slot-' + i;
    const unoClass = p.hand.length === 1 ? ' uno' : '';
    slot.innerHTML = '<div class="opponent-name">' + p.name + ' <span class="card-count-badge' + unoClass + '">' + p.hand.length + '</span></div>';
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'opponent-cards';
    const visible = Math.min(p.hand.length, 10);
    for (let j = 0; j < visible; j++) {
      const mini = document.createElement('div');
      mini.className = 'card-back-mini';
      mini.textContent = 'F';
      cardsDiv.appendChild(mini);
    }
    if (p.hand.length > 10) {
      const more = document.createElement('div');
      more.className = 'card-back-mini';
      more.textContent = '+' + (p.hand.length - 10);
      cardsDiv.appendChild(more);
    }
    slot.appendChild(cardsDiv);
    area.appendChild(slot);
  });
}

export function renderDiscard() {
  const container = document.getElementById('discard-top');
  container.innerHTML = '';
  const top = topCard();
  if (top) {
    const el = buildCardEl(top, false, false);
    el.classList.add('card-played');
    container.appendChild(el);
  }
}

export function renderPlayerHand() {
  const hand     = document.getElementById('player-hand');
  hand.innerHTML = '';
  const player   = G.players[0];
  const myTurn   = G.currentPlayerIndex === 0 && !G.blocked && G.gamePhase === 'playing' && !G.waitingForModal;
  const top      = topCard();

  player.hand.forEach((card, idx) => {
    const canPlay = myTurn && isPlayable(card, top);
    const el = buildCardEl(card, false, canPlay);
    if (canPlay) el.addEventListener('click', () => _onHumanPlayCard(idx));
    hand.appendChild(el);
  });

  const unoBtn = document.getElementById('uno-btn');
  if (player.hand.length === 1 && !player.calledUno) {
    unoBtn.style.display = 'inline-block';
    unoBtn.classList.toggle('urgent', myTurn);
  } else {
    unoBtn.style.display = 'none';
    unoBtn.classList.remove('urgent');
    if (player.hand.length !== 1) player.calledUno = false;
  }
}

export function renderDeckCount() {
  const el = document.getElementById('deck-count');
  if (el) el.textContent = G.deck.length + ' left';
}

export function renderColorDot() {
  const dot = document.getElementById('current-color-dot');
  const lbl = document.getElementById('current-color-label');
  if (!dot) return;
  if (G.currentColor && COLOR_DATA[G.currentColor]) {
    dot.style.background = COLOR_DATA[G.currentColor].hex;
    dot.style.boxShadow  = '0 0 16px ' + COLOR_DATA[G.currentColor].hex;
    lbl.textContent      = COLOR_DATA[G.currentColor].label;
  } else {
    dot.style.background = '#888';
    dot.style.boxShadow  = 'none';
    lbl.textContent      = 'Wild';
  }
}

export function renderDirection() {
  const el = document.getElementById('direction-indicator');
  if (el) el.textContent = G.direction === 1 ? '➡️' : '⬅️';
}

export function renderDrawStack() {
  const badge = document.getElementById('draw-stack-badge');
  if (!badge) return;
  if (G.pendingDraws > 0) {
    badge.style.display = 'block';
    badge.textContent   = '+' + G.pendingDraws + ' ⚠️';
  } else {
    badge.style.display = 'none';
  }
}

export function renderTurnLabel() {
  const lbl     = document.getElementById('turn-label');
  const nameLbl = document.getElementById('player-name-label');
  if (!lbl) return;
  const cur = G.players[G.currentPlayerIndex];
  lbl.textContent = cur.isBot ? (cur.name + "'s turn") : '✨ Your Turn!';
  if (nameLbl) {
    nameLbl.textContent = G.players[0].name;
    nameLbl.classList.toggle('active-turn', G.currentPlayerIndex === 0);
  }
}

export function buildCardEl(card, faceDown, playable) {
  const el      = document.createElement('div');
  const isWild  = WILD_TYPES.has(card.type);
  const isVar   = VARIETY_TYPES.has(card.type);
  const classes = ['card'];
  if (faceDown) classes.push('face-down');
  if (isWild)   classes.push('wild-card');
  if (isVar)    classes.push('variety-card');
  if (playable) classes.push('playable');
  el.className  = classes.join(' ');
  el.dataset.id = card.id;

  if (faceDown) {
    el.innerHTML = '<div class="card-inner"><span class="card-back-logo">F</span></div>';
    return el;
  }

  if (!isWild && !isVar && card.color && COLOR_DATA[card.color]) {
    const hex = COLOR_DATA[card.color].hex;
    el.style.background = 'linear-gradient(160deg, ' + hex + 'ee, ' + hex + '99)';
  }

  const sym    = card.type === 'number' ? card.value : (SYMBOL[card.type] !== undefined ? SYMBOL[card.type] : card.type);
  const corner = card.type === 'number' ? card.value : (SYMBOL[card.type] !== undefined ? SYMBOL[card.type] : '?');

  el.innerHTML = '<div class="card-inner">' +
    ((!isWild && !isVar) ? '<div class="card-ellipse"></div>' : '') +
    '<span class="card-corner tl">' + corner + '</span>' +
    '<span class="card-center-symbol">' + sym + '</span>' +
    '<span class="card-corner br">' + corner + '</span>' +
    '</div>';

  return el;
}
