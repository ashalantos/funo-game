// ================================================================
// FUNO — Main entry point
// ================================================================
import { startGame, callUno, humanDraw, goToSetup } from './game.js';
import { G } from './state.js';

// Slider bindings
function bindSlider(sliderId, labelId) {
  const slider = document.getElementById(sliderId);
  const label  = document.getElementById(labelId);
  if (!slider || !label) return;
  label.textContent = slider.value;
  slider.addEventListener('input', () => { label.textContent = slider.value; });
}
bindSlider('num-players', 'num-players-val');
bindSlider('num-colors',  'num-colors-val');
bindSlider('max-number',  'max-number-val');

// Start button
document.getElementById('start-btn').addEventListener('click', () => {
  const playerName = (document.getElementById('player-name').value.trim() || 'Player').slice(0, 16);
  const numPlayers = parseInt(document.getElementById('num-players').value, 10);
  const numColors  = parseInt(document.getElementById('num-colors').value, 10);
  const maxNumber  = parseInt(document.getElementById('max-number').value, 10);

  const drawCards = [];
  ['draw1','draw2','draw3','draw4','draw5'].forEach(d => {
    if (document.getElementById(d).checked) drawCards.push(d);
  });

  const varietyCards = [];
  ['swap','bomb','lucky','mirror','chaos'].forEach(v => {
    if (document.getElementById('var-' + v).checked) varietyCards.push(v);
  });

  startGame({ playerName, numPlayers, numColors, maxNumber, drawCards, varietyCards });
});

// Draw pile click
document.getElementById('draw-card-btn').addEventListener('click', () => {
  if (G.gamePhase !== 'playing') return;
  humanDraw();
});
document.getElementById('draw-card-btn').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') humanDraw();
});

// UNO button
document.getElementById('uno-btn').addEventListener('click', callUno);

// Play Again
document.getElementById('play-again-btn').addEventListener('click', () => {
  document.getElementById('gameover-modal').classList.add('hidden');
  if (G.settings) startGame(G.settings);
});

// Setup button
document.getElementById('setup-btn').addEventListener('click', goToSetup);

// Cancel swap
document.getElementById('cancel-swap-btn').addEventListener('click', () => {
  document.getElementById('swap-picker-modal').classList.add('hidden');
  G.waitingForModal = false;
  import('./game.js').then(m => m.nextTurn());
});

// Show rewarded ad button only when running inside the Android app
if (window.FunoApp) {
  const rewardBtn = document.getElementById('rewarded-btn');
  if (rewardBtn) rewardBtn.classList.remove('hidden');
}

// Called by the rewarded ad button — asks Android to show the video
window.requestRewardAd = function() {
  if (window.FunoApp) {
    window.FunoApp.requestRewardedAd();
  }
};
