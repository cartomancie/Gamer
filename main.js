// ---------- main.js ----------
// Orquestra as telas, o estado salvo e liga os botões da interface.

let state = Storage.load();
let decayLoop = null;
let renamingMode = false;

function persist(){
  Storage.save(state);
}

function updateHomeUI(){
  Cat.render(state);
  document.getElementById('coins-display').textContent = state.coins;
  const modalCoins = document.getElementById('modal-coins');
  if(modalCoins) modalCoins.textContent = state.coins;
}

function startDecayLoop(){
  clearInterval(decayLoop);
  decayLoop = setInterval(() => {
    if(state.sleeping){
      // fome/felicidade caem bem mais devagar enquanto o gatinho dorme
      state.hunger = Utils.clamp(state.hunger - (HUNGER_DECAY_PER_MIN / 60) * 0.25, 0, 100);
      state.happy = Utils.clamp(state.happy - (HAPPY_DECAY_PER_MIN / 60) * 0.25, 0, 100);
    }else{
      state.hunger = Utils.clamp(state.hunger - HUNGER_DECAY_PER_MIN / 60, 0, 100);
      state.happy = Utils.clamp(state.happy - HAPPY_DECAY_PER_MIN / 60, 0, 100);
    }
    updateHomeUI();
    persist();

    if(state.hunger < 15 && !state.sleeping && Math.random() < 0.15){
      Utils.showToast(`${state.name} está com muita fome... 🍞`);
    }
  }, 1000);
}

function goHome(){
  Utils.showScreen('screen-home');
  updateHomeUI();
}

// ---------- Tela: nome do gato ----------
function initNameScreen(){
  const input = document.getElementById('input-name');
  const btn = document.getElementById('btn-confirm-name');
  const error = document.getElementById('name-error');

  const confirm = () => {
    const value = input.value.trim();
    if(value.length < 1){
      error.textContent = 'Digite um nome para o gatinho!';
      return;
    }
    if(value.length > 16){
      error.textContent = 'Nome muito grande (máx. 16 letras).';
      return;
    }
    error.textContent = '';
    state.name = value;
    if(renamingMode){
      renamingMode = false;
      persist();
      goHome();
      Utils.showToast('Nome atualizado! ✨');
    }else{
      state.hunger = 100;
      state.happy = 100;
      persist();
      Sound.feedComplete();
      goHome();
      Utils.showToast(`Bem-vindo(a), ${state.name}! 🐾`);
    }
  };

  btn.addEventListener('click', confirm);
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') confirm();
  });
}

function openRenameScreen(){
  renamingMode = true;
  const input = document.getElementById('input-name');
  input.value = state.name;
  document.getElementById('name-error').textContent = '';
  document.querySelector('.name-card h1').textContent = 'Trocar o nome';
  document.querySelector('.name-card p').textContent = 'Como prefere chamá-lo agora?';
  document.getElementById('btn-confirm-name').textContent = 'Salvar nome';
  Utils.showScreen('screen-name');
  input.focus();
}

// ---------- Tela: casa ----------
function initHomeScreen(){
  document.getElementById('btn-rename').addEventListener('click', openRenameScreen);

  document.getElementById('btn-pet').addEventListener('click', () => {
    if(state.sleeping) return;
    Sound.pet();
    Cat.playAction('petting', 500);
    Cat.spawnHearts(4);
    state.happy = Utils.clamp(state.happy + 3, 0, 100);
    updateHomeUI();
    persist();
  });

  document.getElementById('btn-feed').addEventListener('click', () => {
    if(state.sleeping) return;
    startFeedMinigame();
  });

  document.getElementById('btn-sleep').addEventListener('click', () => {
    state.sleeping = !state.sleeping;
    if(state.sleeping){
      Sound.sleep();
      Utils.showToast(`${state.name || 'Seu gatinho'} foi dormir... 😴`);
    }else{
      Sound.wake();
      Utils.showToast(`${state.name || 'Seu gatinho'} acordou! ☀️`);
    }
    updateHomeUI();
    persist();
  });
}

// ---------- Minigame ----------
function startFeedMinigame(){
  Utils.showScreen('screen-minigame');
  Minigame.start((result) => {
    finishFeedMinigame(result);
  });
}

function finishFeedMinigame(result){
  const hungerGain = result.caught * 9;
  const happyGain = result.caught * 3;
  // Cuidar do gatinho (alimentar) rende moedas fixas por sessão + bônus por peixe
  const coinsGain = (result.caught > 0 ? 25 : 0) + (result.fishCaught || 0) * 10;

  state.hunger = Utils.clamp(state.hunger + hungerGain, 0, 100);
  state.happy = Utils.clamp(state.happy + happyGain, 0, 100);
  state.coins += coinsGain;
  state.totalFed += result.caught;
  persist();

  updateHomeUI();
  document.getElementById('result-caught').textContent = result.caught;
  document.getElementById('result-coins').textContent = coinsGain;

  let emoji = '🎉', title = 'Muito bem!', desc = `${state.name} adorou a refeição!`;
  if(result.caught === 0){
    emoji = '😿'; title = 'Ih, não rolou...';
    desc = `${state.name} continua com fome. Tente de novo!`;
  }else if(result.caught < 4){
    emoji = '🙂'; title = 'Foi alguma coisa!';
    desc = `${state.name} comeu um pouquinho.`;
  }else if(result.caught >= 10){
    emoji = '🤩'; title = 'Show de bola!';
    desc = `${state.name} ficou super satisfeito!`;
  }
  if(result.fishCaught > 0){
    desc += ` E ainda pescou ${result.fishCaught} peixinho${result.fishCaught > 1 ? 's' : ''} bônus! 🐟`;
  }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-desc').textContent = desc;

  Utils.showScreen('screen-result');

  if(result.caught > 0){
    Sound.feedComplete();
  }else{
    Sound.sad();
  }
}

function initResultScreen(){
  document.getElementById('btn-back-home').addEventListener('click', () => {
    goHome();
    if(state.totalFed > 0){
      Cat.playAction('eating', 1000);
      setTimeout(() => Cat.spawnCrumbs(6), 100);
    }
  });
}

// ---------- Boot ----------
function boot(){
  Cat.init();
  Minigame.init();
  initNameScreen();
  initHomeScreen();
  initResultScreen();
  Shop.init(() => state, () => { updateHomeUI(); persist(); });

  document.getElementById('coins-display').textContent = state.coins;

  if(!state.name){
    Utils.showScreen('screen-name');
  }else{
    goHome();
  }

  startDecayLoop();
}

document.addEventListener('DOMContentLoaded', boot);
