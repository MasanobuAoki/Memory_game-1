const emojiSet = [
  '🍄','⭐','🎮','🧩','🔔','💎','🍎','🐚','🍀','🔥','⚡','🌈',
  '🪙','👾','🎲','🎯','🥇','🎵'
];

const difficulties = {
  easy: { cols: 4, rows: 3 },
  normal: { cols: 4, rows: 4 },
  hard: { cols: 6, rows: 4 },
  insane: { cols: 6, rows: 6 }
};

const $board = document.getElementById('board');
const $moves = document.getElementById('moves');
const $matches = document.getElementById('matches');
const $time = document.getElementById('time');
const $announce = document.getElementById('announce');
const $difficulty = document.getElementById('difficulty');
const $restart = document.getElementById('restartBtn');
const $mute = document.getElementById('muteToggle');
const $modal = document.getElementById('modal');
const $playAgain = document.getElementById('playAgainBtn');
const $closeModal = document.getElementById('closeModalBtn');

let gameState = null;

const sounds = {
  flip: createTone(880, 0.05),
  match: createTone(660, 0.12),
  mismatch: createTone(180, 0.12),
  win: createTone(1200, 0.25)
};

function initGame() {
  const difficultyKey = $difficulty.value;
  const { cols, rows } = difficulties[difficultyKey];
  const totalCards = cols * rows;

  const deck = buildDeck(totalCards);
  $board.style.setProperty('--cols', cols.toString());
  $board.innerHTML = '';

  gameState = {
    deck,
    firstCardId: null,
    lock: false,
    moves: 0,
    matches: 0,
    totalPairs: totalCards / 2,
    startMs: null,
    timerInterval: null,
    muted: $mute.checked
  };

  $moves.textContent = '0';
  $matches.textContent = '0';
  $time.textContent = '00:00';

  renderBoard(deck);
  startTimer();
}

function buildDeck(totalCards) {
  const uniqueNeeded = totalCards / 2;
  const chosen = shuffle(emojiSet).slice(0, uniqueNeeded);
  const pairEmojis = shuffle([...chosen, ...chosen]);
  return pairEmojis.map((symbol, index) => ({
    id: `c${index}`,
    symbol,
    matched: false
  }));
}

function renderBoard(deck) {
  const fragment = document.createDocumentFragment();

  for (const card of deck) {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.type = 'button';
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', 'Hidden card');
    btn.setAttribute('data-id', card.id);
    btn.addEventListener('click', onCardClick);
    btn.addEventListener('keydown', onCardKeydown);

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.textContent = '🎴';

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    back.textContent = card.symbol;

    btn.appendChild(front);
    btn.appendChild(back);
    fragment.appendChild(btn);
  }

  $board.appendChild(fragment);
}

function onCardKeydown(e) {
  const current = e.currentTarget;
  const cards = Array.from($board.querySelectorAll('.card'));
  const index = cards.indexOf(current);
  const cols = parseInt(getComputedStyle($board).getPropertyValue('--cols'), 10);

  switch (e.key) {
    case 'ArrowRight': {
      const next = cards[(index + 1) % cards.length];
      next.focus();
      e.preventDefault();
      break;
    }
    case 'ArrowLeft': {
      const prev = cards[(index - 1 + cards.length) % cards.length];
      prev.focus();
      e.preventDefault();
      break;
    }
    case 'ArrowDown': {
      const next = cards[(index + cols) % cards.length];
      next.focus();
      e.preventDefault();
      break;
    }
    case 'ArrowUp': {
      const prev = cards[(index - cols + cards.length) % cards.length];
      prev.focus();
      e.preventDefault();
      break;
    }
    case 'Enter':
    case ' ': {
      current.click();
      e.preventDefault();
      break;
    }
    default: break;
  }
}

function onCardClick(e) {
  if (!gameState || gameState.lock) return;

  const button = e.currentTarget;
  const id = button.getAttribute('data-id');
  const card = gameState.deck.find(c => c.id === id);
  if (!card || card.matched) return;

  if (!button.class
