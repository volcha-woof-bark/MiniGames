let state = JSON.parse(localStorage.getItem('tamagotchiState')) || null;

const typeSelect = document.getElementById('typeSelect');
const nameSelect = document.getElementById('nameSelect');
const nameInput = document.getElementById('pet-name-input');
const confirmNameBtn = document.getElementById('confirm-name-btn');

const mainContainer = document.getElementById('mainContainer');
const titleEl = document.querySelector('.tamagotchi-container h1');
const petEl = document.getElementById('pet');
const hungerBar = document.getElementById('hunger-bar');
const happinessBar = document.getElementById('happiness-bar');
const energyBar = document.getElementById('energy-bar');
const messageEl = document.getElementById('message');
const sleepTimerEl = document.getElementById('sleep-timer');

const feedBtn = document.getElementById('feed-btn');
const playBtn = document.getElementById('play-btn');
const sleepBtn = document.getElementById('sleep-btn');
const resetBtn = document.getElementById('reset-btn');

const petEmojis = {
  cat: { normal: '🐱', happy: '😺', sad: '😿', sleeping: '🛌' },
  dog: { normal: '🐶', happy: '🐕', sad: '😢', sleeping: '🛌' },
  bird: { normal: '🐦', happy: '🕊️', sad: '🥺', sleeping: '💤' }
};

let currentEmojiSet = petEmojis.cat;
let isPaused = false;
let lastSaved = Date.now();

function init() {
  if (!state) {
    typeSelect.style.display = 'flex';
    nameSelect.style.display = 'none';
    mainContainer.style.display = 'none';

    document.querySelectorAll('.pet-option').forEach(el => {
      el.addEventListener('click', () => {
        window.selectedType = el.dataset.type;
        typeSelect.style.display = 'none';
        nameSelect.style.display = 'flex';
        nameInput.value = '';
        nameInput.focus();
      });
    });

    confirmNameBtn.addEventListener('click', confirmName);
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') confirmName();
    });

  } else {
    typeSelect.style.display = 'none';
    nameSelect.style.display = 'none';
    mainContainer.style.display = 'block';
    setupGame();
  }
}

function confirmName() {
  let name = nameInput.value.trim();
  if (!name) {
    name = 'Дружок';
  }
  if (name.length > 12) {
    name = name.substring(0, 12);
  }

  state = {
    name: name,
    type: window.selectedType,
    hunger: 100,
    happiness: 100,
    energy: 100,
    isSleeping: false,
    sleepEndTime: null,
    lastUpdate: Date.now()
  };

  localStorage.setItem('tamagotchiState', JSON.stringify(state));
  nameSelect.style.display = 'none';
  mainContainer.style.display = 'block';
  setupGame();
}

function setupGame() {
  titleEl.textContent = `🧸 Питомец: ${state.name}`;
  currentEmojiSet = petEmojis[state.type] || petEmojis.cat;

  document.addEventListener('visibilitychange', () => {
    isPaused = document.hidden;
    if (!isPaused) {
      lastSaved = Date.now();
      gameLoop();
    }
  });

  updateUI();
  gameLoop();
}

function gameLoop() {
  if (isPaused || !state) return;

  const now = Date.now();
  const elapsedSec = (now - lastSaved) / 1000;
  lastSaved = now;

  if (!state.isSleeping) {
    state.hunger = Math.max(0, state.hunger - elapsedSec * 0.12);
    state.happiness = Math.max(0, state.happiness - elapsedSec * 0.08);
    state.energy = Math.max(0, state.energy - elapsedSec * 0.1);

    if (state.hunger <= 0 || state.happiness <= 0) {
      messageEl.textContent = '...';
      petEl.textContent = '💀';
      petEl.style.opacity = '0.5';
      return;
    }
  }

  if (state.isSleeping && state.sleepEndTime) {
    const remaining = Math.ceil((state.sleepEndTime - Date.now()) / 1000);
    if (remaining > 0) {
      sleepTimerEl.textContent = `Осталось спать: ${remaining} сек`;
    } else {
      state.isSleeping = false;
      state.energy = 100;
      state.sleepEndTime = null;
      sleepTimerEl.textContent = '';
    }
  }

  updateUI();
  setTimeout(gameLoop, 1000);
}

function updateUI() {
  if (!state) return;

  hungerBar.style.width = state.hunger + '%';
  happinessBar.style.width = state.happiness + '%';
  energyBar.style.width = state.energy + '%';

  petEl.className = 'pet';
  let emoji = currentEmojiSet.normal;

  if (state.isSleeping) {
    petEl.classList.add('sleeping');
    emoji = currentEmojiSet.sleeping || '🛌';
  } else if (state.happiness < 30) {
    emoji = currentEmojiSet.sad || '😢';
  } else if (state.happiness > 80) {
    emoji = currentEmojiSet.happy || '😊';
    setTimeout(() => petEl.classList.add('happy'), 100);
  }

  petEl.textContent = emoji;

  if (state.isSleeping) {
    messageEl.textContent = 'Тсс... Я сплю 💤';
  } else if (state.hunger < 20) {
    messageEl.textContent = 'Я голоден... 🍽️';
  } else if (state.happiness < 20) {
    messageEl.textContent = 'Мне грустно... 💔';
  } else if (state.energy < 20) {
    messageEl.textContent = 'Мне хочется спать... 😴';
  } else {
    messageEl.textContent = `Рад тебя видеть, ${state.name}! 💙`;
  }
}

feedBtn.addEventListener('click', () => {
  if (!state || state.isSleeping) {
    messageEl.textContent = state ? 'Сначала разбуди меня!' : '...';
    return;
  }
  state.hunger = Math.min(100, state.hunger + 25);
  state.happiness = Math.min(100, state.happiness + 5);
  saveAndRefresh();
});

playBtn.addEventListener('click', () => {
  if (!state || state.isSleeping) {
    messageEl.textContent = state ? 'Сначала разбуди меня!' : '...';
    return;
  }
  if (state.energy < 15) {
    messageEl.textContent = 'Я слишком устал... 😴';
    return;
  }
  state.happiness = Math.min(100, state.happiness + 30);
  state.energy = Math.max(0, state.energy - 15);
  state.hunger = Math.max(0, state.hunger - 10);
  petEl.textContent = '🎉';
  setTimeout(() => saveAndRefresh(), 300);
});

sleepBtn.addEventListener('click', () => {
  if (!state) return;
  if (state.isSleeping) {
    messageEl.textContent = 'Я уже сплю!';
    return;
  }
  if (state.energy > 80) {
    messageEl.textContent = 'Я не хочу спать сейчас.';
    return;
  }

  state.isSleeping = true;
  state.sleepEndTime = Date.now() + 10000;
  sleepTimerEl.textContent = 'Осталось спать: 10 сек';
  saveAndRefresh();
});

resetBtn.addEventListener('click', () => {
  if (confirm('Сбросить Тамагочи?')) {
    localStorage.removeItem('tamagotchiState');
    location.reload();
  }
});

function saveAndRefresh() {
  if (!state) return;
  state.lastUpdate = Date.now();
  localStorage.setItem('tamagotchiState', JSON.stringify(state));
  updateUI();
}

init();