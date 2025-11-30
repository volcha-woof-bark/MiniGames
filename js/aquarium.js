
let state;
try {
  const saved = localStorage.getItem('aquariumState');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed.pet === 'string' && parsed.pet.trim()) {
      state = parsed;
    }
  }
} catch (e) { }
if (!state || typeof state.fishCount !== 'number' || state.fishCount < 0) {
  state = { pet: null, happiness: 0, fishCount: 3 };
}

const aquarium = document.getElementById('aquarium');
const petSelect = document.getElementById('petSelect');
const width = window.innerWidth;
const height = window.innerHeight;

let fishes = [];
let foods = [];
let audioContext = null;
let currentMode = 'tap';

function playSound(frequency = 250, duration = 0.25) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.06;
    oscillator.type = 'sine';
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) { }
}


function createSeaweedGrove() {
  const aquarium = document.getElementById('aquarium');
  const width = aquarium.offsetWidth;
  const count = 7;

  for (let i = 0; i < count; i++) {
    const leftPos = 50 + Math.random() * (width - 100);
    const height = 100 + Math.random() * 80;
    const curve = Math.random() > 0.5 ? 'left' : 'right';
    
    let pathData;
    if (curve === 'left') {
      pathData = `M10,${height} Q5,${height - 30} 9,${height - 60} Q3,${height - 90} 11,${height - 120} Q6,${height - 150} 10,0`;
    } else {
      pathData = `M10,${height} Q15,${height - 30} 11,${height - 60} Q17,${height - 90} 9,${height - 120} Q14,${height - 150} 10,0`;
    }

    const svg = `<svg viewBox="0 0 20 ${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;"><path d="${pathData}" stroke="#2a5545" stroke-width="3" fill="none" /></svg>`;

    const seaweed = document.createElement('div');
    seaweed.className = 'seaweed';
    seaweed.style.left = leftPos + 'px';
    seaweed.style.height = height + 'px';
    seaweed.innerHTML = svg;
    seaweed.style.animationDelay = (Math.random() * 5) + 's';
    aquarium.appendChild(seaweed);
  }
}


function addBottomDecorations() {
  const aquarium = document.getElementById('aquarium');
  const items = [
    { char: '●', size: '16px', color: '#4a4f5a', left: '15%', bottom: '92px' },
    { char: '●', size: '12px', color: '#5a5f6a', left: '22%', bottom: '94px' },
    { char: '●', size: '14px', color: '#4d525d', left: '78%', bottom: '93px' },
    { char: '●', size: '10px', color: '#555a65', left: '85%', bottom: '95px' },
    { char: '✿', size: '18px', color: '#6a5f55', left: '40%', bottom: '92px' },
    { char: '✿', size: '16px', color: '#72655c', left: '60%', bottom: '93px' }
  ];

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'decoration-item';
    el.textContent = item.char;
    el.style.fontSize = item.size;
    el.style.color = item.color;
    el.style.left = item.left;
    el.style.bottom = item.bottom;
    el.style.opacity = '0.65';
    aquarium.appendChild(el);
  });
}


const commonFishEmojis = ['🐠', '🐟', '🐡', '🦀', '🦐', '🐙'];
const petEmojis = ['🐋', '🦈', '🦑'];


function createFish(isPet = false, petType = null) {
  const fish = document.createElement('div');
  fish.className = 'fish';
  let emoji;

  if (isPet) {
    emoji = petType || state.pet;
    fish.classList.add('pet');
  } else {
    emoji = commonFishEmojis[Math.floor(Math.random() * commonFishEmojis.length)];
    while (petEmojis.includes(emoji)) {
      emoji = commonFishEmojis[Math.floor(Math.random() * commonFishEmojis.length)];
    }
  }

  fish.textContent = emoji;
  

  const baseSize = (isPet ? 2.2 : 1.3 + Math.random() * 0.5);
  fish.style.fontSize = baseSize + 'rem';

  const x = Math.random() * width;
  const y = 100 + Math.random() * (height - 200);
  fish.style.left = x + 'px';
  fish.style.top = y + 'px';

  const dx = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 1.0);
  const dy = (Math.random() - 0.5) * 0.7;

  fish.dataset.x = x;
  fish.dataset.y = y;
  fish.dataset.dx = dx;
  fish.dataset.dy = dy;
  fish.dataset.isPet = isPet;
  fish.dataset.originalDx = dx;
  fish.dataset.originalDy = dy;
  

  fish.dataset.baseSize = baseSize;
  fish.dataset.size = 1.0;

  aquarium.appendChild(fish);
  fishes.push(fish);
  if (!isPet) {
    state.fishCount = (state.fishCount || 0) + 1;
    localStorage.setItem('aquariumState', JSON.stringify(state));
  }
  return fish;
}


function animate() {
  if (!aquarium) return;

  for (let i = fishes.length - 1; i >= 0; i--) {
    const fish = fishes[i];
    if (!fish.parentNode) continue;

    let x = parseFloat(fish.dataset.x) || 0;
    let y = parseFloat(fish.dataset.y) || 0;
    let dx = parseFloat(fish.dataset.dx) || 0;
    let dy = parseFloat(fish.dataset.dy) || 0;

    x += dx;
    y += dy;

    if (x < -60) x = width + 60;
    if (x > width + 60) x = -60;
    if (y < 30) { y = 30; dy = Math.abs(dy); }
    if (y > height - 120) { y = height - 120; dy = -Math.abs(dy); }

    fish.style.left = x + 'px';
    fish.style.top = y + 'px';

    fish.dataset.x = x;
    fish.dataset.y = y;
    fish.dataset.dx = dx;
    fish.dataset.dy = dy;
  }

  if (currentMode === 'feed') {
    for (let i = foods.length - 1; i >= 0; i--) {
      const foodObj = foods[i];
      if (!foodObj.el.parentNode) {
        foods.splice(i, 1);
        continue;
      }
      const rect = foodObj.el.getBoundingClientRect();
      foodObj.x = rect.left + rect.width / 2;
      foodObj.y = rect.top + rect.height / 2;
    }

    for (const fish of fishes) {
      let bestFood = null;
      let minDist = 250;
      for (const foodObj of foods) {
        const fx = foodObj.x;
        const fy = foodObj.y;
        const fishX = parseFloat(fish.dataset.x) || 0;
        const fishY = parseFloat(fish.dataset.y) || 0;
        const dist = Math.sqrt((fishX - fx) ** 2 + (fishY - fy) ** 2);
        if (dist < minDist) {
          minDist = dist;
          bestFood = foodObj;
        }
      }
      if (bestFood) {
        const fishX = parseFloat(fish.dataset.x) || 0;
        const fishY = parseFloat(fish.dataset.y) || 0;
        const dx = bestFood.x - fishX;
        const dy = bestFood.y - fishY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 1.8;
        fish.dataset.dx = (dx / dist) * speed;
        fish.dataset.dy = (dy / dist) * speed;
      } else {
        fish.dataset.dx = fish.dataset.originalDx;
        fish.dataset.dy = fish.dataset.originalDy;
      }
    }
  }

  const foodsToRemove = [];
  for (let i = 0; i < foods.length; i++) {
    const foodObj = foods[i];
    const foodRect = foodObj.el.getBoundingClientRect();
    const foodCenterX = foodRect.left + foodRect.width / 2;
    const foodCenterY = foodRect.top + foodRect.height / 2;

    let eaten = false;
    for (const fish of fishes) {
      const fishRect = fish.getBoundingClientRect();
      const fishCenterX = fishRect.left + fishRect.width / 2;
      const fishCenterY = fishRect.top + fishRect.height / 2;

      const dist = Math.sqrt(
        (fishCenterX - foodCenterX) ** 2 +
        (fishCenterY - foodCenterY) ** 2
      );
      if (dist < 40) {
        foodsToRemove.push(i);
        eaten = true;
        playSound(400, 0.15);
        

        const currentSize = parseFloat(fish.dataset.size) || 1.0;
        const newSize = Math.min(currentSize + 0.1, 1.8); 
        fish.dataset.size = newSize;
        const baseSize = parseFloat(fish.dataset.baseSize) || 1.5;
        fish.style.fontSize = (baseSize * newSize) + 'rem';
        
        state.happiness = (state.happiness || 0) + 1;
        localStorage.setItem('aquariumState', JSON.stringify(state));
        break;
      }
    }
  }


  for (let i = foodsToRemove.length - 1; i >= 0; i--) {
    const idx = foodsToRemove[i];
    if (foods[idx] && foods[idx].el.parentNode) {
      foods[idx].el.remove();
    }
    foods.splice(idx, 1);
  }

  requestAnimationFrame(animate);
}


function triggerTap(x, y) {
  playSound(220, 0.3);
  const pulse = document.createElement('div');
  pulse.className = 'wave-pulse';
  pulse.style.left = (x - 10) + 'px';
  pulse.style.top = (y - 10) + 'px';
  aquarium.appendChild(pulse);
  setTimeout(() => {
    if (pulse.parentNode) pulse.remove();
  }, 1200);

  fishes.forEach(fish => {
    const fx = parseFloat(fish.dataset.x) || 0;
    const fy = parseFloat(fish.dataset.y) || 0;
    const dist = Math.sqrt((fx - x) ** 2 + (fy - y) ** 2);
    if (dist < 280) {
      const intensity = 1 - dist / 280;
      const towardsX = (x - fx) * 0.025 * intensity;
      const towardsY = (y - fy) * 0.025 * intensity;
      fish.dataset.dx = (parseFloat(fish.dataset.originalDx) || 0) + towardsX;
      fish.dataset.dy = (parseFloat(fish.dataset.originalDy) || 0) + towardsY;
      const speedBoost = 0.7 * intensity;
      fish.dataset.dx *= (1 + speedBoost);
      fish.dataset.dy *= (1 + speedBoost);
      setTimeout(() => {
        if (fish.parentNode) {
          fish.dataset.dx = fish.dataset.originalDx;
          fish.dataset.dy = fish.dataset.originalDy;
        }
      }, 2000);
    }
  });
}

function triggerFeed(x, y) {
  playSound(300, 0.2);
  const food = document.createElement('div');
  food.className = 'food';
  food.textContent = '●';
  food.style.color = '#8B4513';
  food.style.left = (x - 14) + 'px';
  food.style.top = '0px';
  aquarium.appendChild(food);
  foods.push({ el: food, x, y: 0 });
  setTimeout(() => {
    if (food.parentNode) {
      food.remove();
      const idx = foods.findIndex(f => f.el === food);
      if (idx >= 0) foods.splice(idx, 1);
    }
  }, 5000);
}


function initAquarium() {
  createSeaweedGrove();
  addBottomDecorations();
  createFish(true);
  const count = Math.min(10, Math.max(0, state.fishCount || 3));
  for (let i = 0; i < count; i++) {
    createFish();
  }

  setInterval(() => {
    if (!aquarium) return;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.left = Math.random() * width + 'px';
    bubble.style.animationDuration = (4 + Math.random() * 5) + 's';
    aquarium.appendChild(bubble);
    setTimeout(() => {
      if (bubble.parentNode) bubble.remove();
    }, 9000);
  }, 1000);

  aquarium.addEventListener('click', (e) => {
    if (e.target === aquarium || e.target.classList.contains('sand')) {
      if (currentMode === 'feed') {
        triggerFeed(e.clientX, e.clientY);
      } else {
        triggerTap(e.clientX, e.clientY);
      }
    }
  });

  animate();
}


document.getElementById('addFishBtn').addEventListener('click', () => {
  if (fishes.length < 12) {
    createFish();
  }
});

const modeBtn = document.getElementById('modeBtn');
modeBtn.addEventListener('click', () => {
  if (currentMode === 'tap') {
    currentMode = 'feed';
    modeBtn.textContent = 'Стук';
    modeBtn.classList.add('active');
  } else {
    currentMode = 'tap';
    modeBtn.textContent = 'Корм';
    modeBtn.classList.remove('active');
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Сбросить аквариум?')) {
    localStorage.removeItem('aquariumState');
    location.reload();
  }
});


if (!state.pet) {
  petSelect.style.display = 'flex';
  document.querySelectorAll('.pet-option').forEach(el => {
    el.addEventListener('click', () => {
      state.pet = el.dataset.pet;
      localStorage.setItem('aquariumState', JSON.stringify(state));
      petSelect.style.display = 'none';
      initAquarium();
    });
  });
} else {
  petSelect.style.display = 'none';
  initAquarium();
}