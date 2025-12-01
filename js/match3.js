
const SYMBOLS = ['★', '▲', '■', '◆', '⬟', '●'];
const SIZE = 8;
let score = 0;
let bestScore = localStorage.getItem('match3Best') || 0;
let grid = [];
let selectedCell = null;
let isProcessing = false;


const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const gridEl = document.getElementById('grid');
const resetBtn = document.getElementById('reset-btn');

bestEl.textContent = `Рекорд: ${bestScore}`;


let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency = 440, duration = 0.1, volume = 0.1) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log("Звук недоступен:", e);
  }
}


function playMatchSound() {
  const freq = 500 + Math.random() * 200; 
  playTone(freq, 0.12, 0.07);
}

function playSelectSound() {
  playTone(300, 0.08, 0.06);
}

function playResetSound() {
  playTone(800, 0.2, 0.12);
}


function initGrid() {
  grid = [];
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;

  for (let y = 0; y < SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < SIZE; x++) {
      let symbol;
      do {
        symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      } while (
        (x >= 2 && grid[y][x - 1] === symbol && grid[y][x - 2] === symbol) ||
        (y >= 2 && grid[y - 1][x] === symbol && grid[y - 2][x] === symbol)
      );
      grid[y][x] = symbol;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = symbol;
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.dataset.symbol = symbol;
      cell.addEventListener('click', () => handleCellClick(cell, x, y));
      gridEl.appendChild(cell);
    }
  }
  score = 0;
  scoreEl.textContent = `Счёт: ${score}`;
}


function handleCellClick(cell, x, y) {
  if (isProcessing) return;


  getAudioContext();

  if (selectedCell) {
    const sx = parseInt(selectedCell.dataset.x);
    const sy = parseInt(selectedCell.dataset.y);
    const dx = Math.abs(x - sx);
    const dy = Math.abs(y - sy);

    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      swapCells(sx, sy, x, y);
      if (!checkMatches()) {
        swapCells(sx, sy, x, y);
      } else {
      }
    }
    selectedCell.classList.remove('selected');
    selectedCell = null;
  } else {
    selectedCell = cell;
    cell.classList.add('selected');
    playSelectSound();
  }
}

function swapCells(x1, y1, x2, y2) {
  [grid[y1][x1], grid[y2][x2]] = [grid[y2][x2], grid[y1][x1]];
  updateCell(x1, y1, grid[y1][x1]);
  updateCell(x2, y2, grid[y2][x2]);
}

function updateCell(x, y, symbol) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (cell) {
    cell.textContent = symbol;
    cell.dataset.symbol = symbol;
  }
}

function waitForAnimations() {
  const cells = document.querySelectorAll('.cell.matched');
  return Promise.all(
    Array.from(cells).map(cell => {
      return new Promise(resolve => {
        if (!cell) return resolve();
        const handleEnd = () => {
          cell.removeEventListener('animationend', handleEnd);
          resolve();
        };
        cell.addEventListener('animationend', handleEnd);
        setTimeout(handleEnd, 550);
      });
    })
  );
}

function checkMatches() {
  const toRemove = new Set();

  for (let y = 0; y < SIZE; y++) {
    let count = 1;
    for (let x = 1; x < SIZE; x++) {
      if (grid[y][x] === grid[y][x - 1]) count++;
      else {
        if (count >= 3) for (let i = x - count; i < x; i++) toRemove.add(`${i},${y}`);
        count = 1;
      }
    }
    if (count >= 3) for (let i = SIZE - count; i < SIZE; i++) toRemove.add(`${i},${y}`);
  }

  for (let x = 0; x < SIZE; x++) {
    let count = 1;
    for (let y = 1; y < SIZE; y++) {
      if (grid[y][x] === grid[y - 1][x]) count++;
      else {
        if (count >= 3) for (let i = y - count; i < y; i++) toRemove.add(`${x},${i}`);
        count = 1;
      }
    }
    if (count >= 3) for (let i = SIZE - count; i < SIZE; i++) toRemove.add(`${x},${i}`);
  }

  if (toRemove.size === 0) return false;

  playMatchSound();

  toRemove.forEach(pos => {
    const [x, y] = pos.split(',').map(Number);
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell) cell.classList.add('matched');
    score += 10;
  });
  scoreEl.textContent = `Счёт: ${score}`;

  isProcessing = true;
  waitForAnimations().then(() => {
    for (let x = 0; x < SIZE; x++) {
      let writePos = SIZE - 1;
      for (let y = SIZE - 1; y >= 0; y--) {
        if (!toRemove.has(`${x},${y}`)) {
          grid[writePos][x] = grid[y][x];
          updateCell(x, writePos, grid[y][x]);
          writePos--;
        }
      }
      for (let y = writePos; y >= 0; y--) {
        const newSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        grid[y][x] = newSymbol;
        updateCell(x, y, newSymbol);
      }
    }

    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('matched');
    });

    setTimeout(() => {
      if (checkMatches()) return;
      if (!hasPossibleMoves()) {
        if (confirm('Ходов больше нет. Обновить поле?')) {
          playResetSound();
          initGrid();
        }
      }
      isProcessing = false;
    }, 100);
  });

  return true;
}

function hasPossibleMoves() {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (x < SIZE - 1) {
        swapCells(x, y, x + 1, y);
        if (checkMatchesSilent()) {
          swapCells(x, y, x + 1, y);
          return true;
        }
        swapCells(x, y, x + 1, y);
      }
      if (y < SIZE - 1) {
        swapCells(x, y, x, y + 1);
        if (checkMatchesSilent()) {
          swapCells(x, y, x, y + 1);
          return true;
        }
        swapCells(x, y, x, y + 1);
      }
    }
  }
  return false;
}

function checkMatchesSilent() {
  for (let y = 0; y < SIZE; y++) {
    let count = 1;
    for (let x = 1; x < SIZE; x++) {
      if (grid[y][x] === grid[y][x - 1]) count++;
      else {
        if (count >= 3) return true;
        count = 1;
      }
    }
    if (count >= 3) return true;
  }
  for (let x = 0; x < SIZE; x++) {
    let count = 1;
    for (let y = 1; y < SIZE; y++) {
      if (grid[y][x] === grid[y - 1][x]) count++;
      else {
        if (count >= 3) return true;
        count = 1;
      }
    }
    if (count >= 3) return true;
  }
  return false;
}


resetBtn.addEventListener('click', () => {
  playResetSound();
  initGrid();
});

window.addEventListener('beforeunload', () => {
  if (score > bestScore) {
    localStorage.setItem('match3Best', score);
  }
});


initGrid();
