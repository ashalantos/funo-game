// ================================================================
// FUNO — UI helpers: toasts, modals, audio, confetti
// ================================================================
import { G } from './state.js';
import { COLOR_DATA } from './constants.js';

// ── Toast Notifications ───────────────────────────────────────────
const TOAST_DURATION = 2600; // ms before removal

export function toast(msg) {
  const area = document.getElementById('notif-area');
  const t    = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  area.appendChild(t);
  setTimeout(() => t.remove(), TOAST_DURATION);
}

// ── Color Picker Modal ────────────────────────────────────────────
/**
 * Show the colour-picker modal.
 * @param {(color:string)=>void} callback  called with the chosen colour key
 */
export function showColorPicker(callback) {
  const modal = document.getElementById('color-picker-modal');
  const grid  = document.getElementById('color-grid');
  grid.innerHTML = '';

  G.activeColors.forEach(c => {
    const btn = document.createElement('button');
    btn.className  = 'color-btn';
    btn.style.background = COLOR_DATA[c].hex;
    btn.title      = COLOR_DATA[c].label;
    btn.setAttribute('aria-label', COLOR_DATA[c].label);
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      callback(c);
    });
    grid.appendChild(btn);
  });

  modal.classList.remove('hidden');
}

// ── Swap Picker Modal ─────────────────────────────────────────────
/**
 * Show the swap-picker modal.
 * @param {number}              sourceIdx  player choosing swap target
 * @param {(targetIdx:number)=>void} callback
 */
export function showSwapPicker(sourceIdx, callback) {
  const modal = document.getElementById('swap-picker-modal');
  const list  = document.getElementById('swap-player-list');
  list.innerHTML = '';

  G.players.forEach((p, i) => {
    if (i === sourceIdx) return;
    const btn = document.createElement('button');
    btn.className   = 'swap-player-btn';
    btn.textContent = `${p.name}  (${p.hand.length} cards)`;
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      callback(i);
    });
    list.appendChild(btn);
  });

  modal.classList.remove('hidden');
}

export function closeSwapModal() {
  document.getElementById('swap-picker-modal').classList.add('hidden');
}

// ── Game Over Modal ───────────────────────────────────────────────
export function showGameOver(winnerIdx, onPlayAgain, onSetup) {
  const winner = G.players[winnerIdx];
  document.getElementById('winner-name').textContent = winner.name;

  const list = document.getElementById('scores-list');
  list.innerHTML = '';
  G.players.forEach((p, i) => {
    const pts = p.hand.reduce((s, c) => {
      if (c.type === 'number') return s + (c.value ?? 0);
      return s + (import('./constants.js').then ? 20 : 20); // fallback
    }, 0);
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="${i === winnerIdx ? 'score-win' : ''}">${i === winnerIdx ? '🏆 ' : ''}${p.name}</span>
      <span>${pts} pts (${p.hand.length} cards left)</span>`;
    list.appendChild(li);
  });

  document.getElementById('gameover-modal').classList.remove('hidden');
  document.getElementById('play-again-btn').onclick = () => {
    document.getElementById('gameover-modal').classList.add('hidden');
    onPlayAgain();
  };
  document.getElementById('setup-btn').onclick = () => {
    document.getElementById('gameover-modal').classList.add('hidden');
    onSetup();
  };
}

// ── Bot thinking indicator ────────────────────────────────────────
export function showBotThinking(name) {
  const el = document.getElementById('bot-thinking');
  if (!el) return;
  document.getElementById('bot-thinking-name').textContent = ' ' + name + ' is thinking';
  el.classList.remove('hidden');
}

export function hideBotThinking() {
  const el = document.getElementById('bot-thinking');
  if (el) el.classList.add('hidden');
}

// ── Confetti ──────────────────────────────────────────────────────
let _confettiId = null;

export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.classList.remove('hidden');
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 180 }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * canvas.height - canvas.height,
    vx:   (Math.random() - 0.5) * 5,
    vy:   Math.random() * 4 + 2,
    color:`hsl(${Math.random() * 360},90%,60%)`,
    size: Math.random() * 9 + 4,
    rot:  Math.random() * 360,
    rotV: (Math.random() - 0.5) * 7,
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
      ctx.restore();
    });
    _confettiId = requestAnimationFrame(frame);
  }
  frame();
}

export function stopConfetti() {
  if (_confettiId) { cancelAnimationFrame(_confettiId); _confettiId = null; }
  const canvas = document.getElementById('confetti-canvas');
  if (canvas) canvas.classList.add('hidden');
}

// ── Web Audio SFX ─────────────────────────────────────────────────
let _audioCtx = null;
function getAudio() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

export function playSound(type) {
  try {
    const ctx  = getAudio();
    if (type === 'play') {
      _beep(ctx, 440, 660, 0.12, 0.15);
    } else if (type === 'draw') {
      _beep(ctx, 300, 280, 0.08, 0.12);
    } else if (type === 'special') {
      _beep(ctx, 600, 900, 0.14, 0.2);
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => _beep(ctx, freq, freq, 0.18, 0.3), i * 130);
      });
    } else if (type === 'uno') {
      _beep(ctx, 880, 1100, 0.2, 0.22);
    }
  } catch (_) { /* audio context unavailable — silently ignore */ }
}

function _beep(ctx, fromFreq, toFreq, gain, duration) {
  const osc  = ctx.createOscillator();
  const amp  = ctx.createGain();
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.frequency.setValueAtTime(fromFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + duration);
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

