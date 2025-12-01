
const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_TO_FREQ = {
  red: 300,
  blue: 400,
  green: 500,
  yellow: 600
};

let sequence = [];
let playerSequence = [];
let level = 1;
let bestLevel = localStorage.getItem('simonBest') || 0;
let isPlayingSequence = false;
let isPlayerTurn = false;
let gameActive = false;


const levelEl = document.getElementById('level');
const bestEl = document.getElementById('best');
const startBtn = document.getElementById('start-btn');
const pads = document.querySelectorAll('.pad');

bestEl.textContent = `Рекорд: ${bestLevel}`;


let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency, duration = 0.3, volume = 0.15) {
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
    console.log("Звук не воспроизведён:", e);
  }
}


function activatePad(color) {
  const pad = document.querySelector(`.pad[data-color="${color}"]`);
  if (!pad) return;

  pad.classList.add('active');
  playTone(COLOR_TO_FREQ[color]);

  return new Promise(resolve => {
    setTimeout(() => {
      pad.classList.remove('active');
      resolve();
    }, 350);
  });
}


async function playSequence() {
  isPlayingSequence = true;
  for (let color of sequence) {
    await new Promise(r => setTimeout(r, 600)); 
    await activatePad(color);
  }
  isPlayingSequence = false;
  isPlayerTurn = true;
}


function startGame() {
  sequence = [];
  playerSequence = [];
  level = 1;
  levelEl.textContent = `Уровень: ${level}`;
  gameActive = true;
  startBtn.disabled = true;
  startBtn.textContent = 'Игра идёт...';

  addToSequence();
  setTimeout(playSequence, 800);
}


function addToSequence() {
  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  sequence.push(randomColor);
}


function handlePadClick(color) {
  if (!gameActive || isPlayingSequence || !isPlayerTurn) return;

  activatePad(color);
  playerSequence.push(color);

  const index = playerSequence.length - 1;
  if (playerSequence[index] !== sequence[index]) {

    gameOver();
    return;
  }

  if (playerSequence.length === sequence.length) {

    isPlayerTurn = false;
    playerSequence = [];

    if (level > bestLevel) {
      bestLevel = level;
      localStorage.setItem('simonBest', bestLevel);
      bestEl.textContent = `Рекорд: ${bestLevel}`;
    }

    level++;
    levelEl.textContent = `Уровень: ${level}`;

    setTimeout(() => {
      addToSequence();
      playSequence();
    }, 800);
  }
}


function gameOver() {
  gameActive = false;
  isPlayerTurn = false;
  startBtn.disabled = false;
  startBtn.textContent = '▶ Начать снова';


  document.querySelectorAll('.pad').forEach(pad => {
    pad.style.opacity = '0.5';
  });

  setTimeout(() => {
    document.querySelectorAll('.pad').forEach(pad => {
      pad.style.opacity = '1';
    });
  }, 1000);
}


pads.forEach(pad => {
  pad.addEventListener('click', () => {
    const color = pad.dataset.color;
    handlePadClick(color);
    getAudioContext(); 
  });
});

startBtn.addEventListener('click', () => {
  getAudioContext();
  startGame();
});

