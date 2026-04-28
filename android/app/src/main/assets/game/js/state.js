// ================================================================
// FUNO — Game State
// ================================================================

export const G = createFreshState();

export function createFreshState() {
  return {
    settings:           null,
    activeColors:       [],
    deck:               [],
    discardPile:        [],
    players:            [],
    currentPlayerIndex: 0,
    direction:          1,
    pendingDraws:       0,
    mirrorSourceIndex:  -1,
    currentColor:       null,
    gamePhase:          'setup',
    waitingForModal:    false,
    blocked:            false,
    _nextCardId:        0,
  };
}

export function topCard() {
  return G.discardPile[G.discardPile.length - 1] || null;
}

export function nextCardId() {
  return ++G._nextCardId;
}
