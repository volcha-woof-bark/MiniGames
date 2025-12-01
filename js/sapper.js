
const BOARD_SIZE = 10;
const MINE_COUNT = 15;

let board = [];
let gameOver = false;
let gameWon = false;
let startTime = null;
let timerInterval = null;
let flaggedMines = 0;
let flagMode = false; 


const startScreen = document.getElementById('start-screen');
const gameUI = document.getElementById('game-ui');
const mineCountEl = document.getElementById('mine-count');
const timeEl = document.getElementById('time');
const resetBtn = document.getElementById('reset-btn');
const gameBoardEl = document.getElementById('game-board');
const startBtn = document.getElementById('start-btn');
const flagToggleBtn = document.getElementById('flag-toggle');


if (flagToggleBtn) {
  flagToggleBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    flagToggleBtn.classList.toggle('active', flagMode);
  });
}

startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  gameUI.style.display = 'block';
  initGame();
});

function initGame() {
  board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => ({
    isMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0
  })));

  gameOver = false;
  gameWon = false;
  flaggedMines = 0;
  flagMode = false; 
  if (flagToggleBtn) flagToggleBtn.classList.remove('active');
  
  clearInterval(timerInterval);
  startTime = null;
  timeEl.textContent = '0';
  mineCountEl.textContent = MINE_COUNT;
  resetBtn.textContent = '🙂';
  gameBoardEl.innerHTML = '';


  let minesPlaced = 0;
  while (minesPlaced < MINE_COUNT) {
    const x = Math.floor(Math.random() * BOARD_SIZE);
    const y = Math.floor(Math.random() * BOARD_SIZE);
    if (!board[y][x].isMine) {
      board[y][x].isMine = true;
      minesPlaced++;
    }
  }

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!board[y][x].isMine) {
        board[y][x].adjacentMines = countAdjacentMines(x, y);
      }
    }
  }

  renderBoard();
}

function countAdjacentMines(x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx].isMine) {
        count++;
      }
    }
  }
  return count;
}

function renderBoard() {
  gameBoardEl.innerHTML = '';
  gameBoardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      
      const cellData = board[y][x];
      if (cellData.isRevealed) {
        cell.classList.add('revealed');
        if (cellData.isMine) {
          cell.classList.add('mine');
          if (gameOver) {
            cell.style.backgroundColor = '#ff6b6b';
          }
        } else if (cellData.adjacentMines > 0) {
          cell.textContent = cellData.adjacentMines;
          cell.dataset.value = cellData.adjacentMines;
        }
      } else if (cellData.isFlagged) {
        cell.classList.add('flagged');
      }

      cell.addEventListener('click', (e) => {
        if (gameOver || gameWon) return;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        handleCellClick(x, y);
      });

      cell.oncontextmenu = (e) => {
        e.preventDefault();
        if (gameOver || gameWon) return;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        toggleFlag(x, y);
        return false;
      };

      gameBoardEl.appendChild(cell);
    }
  }
}

function handleCellClick(x, y) {
  if (gameOver || gameWon) return;
  const cell = board[y][x];
  if (cell.isRevealed) return;

  if (flagMode) {
    toggleFlag(x, y);
  } else {
    openCell(x, y);
  }
}


function toggleFlag(x, y) {
  const cell = board[y][x];
  if (cell.isRevealed || gameOver || gameWon) return;

  if (cell.isFlagged) {
    cell.isFlagged = false;
    flaggedMines--;
  } else {
    cell.isFlagged = true;
    flaggedMines++;
  }

  mineCountEl.textContent = MINE_COUNT - flaggedMines;
  renderBoard();
}

function openCell(x, y) {
  const cell = board[y][x];
  if (cell.isFlagged) return;

  if (!startTime) {
    startTime = Date.now();
    timerInterval = setInterval(() => {
      timeEl.textContent = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
  }

  if (cell.isMine) {
    gameOver = true;
    resetBtn.textContent = '😵';
    clearInterval(timerInterval);
    revealAllMines();
    renderBoard();
    return;
  }

  revealArea(x, y);

  if (checkWin()) {
    gameWon = true;
    resetBtn.textContent = '😎';
    clearInterval(timerInterval);
  }
}

function revealArea(startX, startY) {
  const stack = [[startX, startY]];
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) continue;
    if (board[y][x].isRevealed || board[y][x].isFlagged) continue;

    board[y][x].isRevealed = true;

    if (board[y][x].adjacentMines === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            stack.push([x + dx, y + dy]);
          }
        }
      }
    }
  }
  renderBoard();
}

function revealAllMines() {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].isMine) {
        board[y][x].isRevealed = true;
      }
    }
  }
}

function checkWin() {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = board[y][x];
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

resetBtn.addEventListener('click', () => {
  startScreen.style.display = 'block';
  gameUI.style.display = 'none';
});
