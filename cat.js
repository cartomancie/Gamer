// ---------- cat.js ----------
// Controla a aparência, humor e as pequenas partículas (corações / migalhas) do gato.

const Cat = {
  els: {},

  init(){
    this.els.sprite = document.getElementById('cat-sprite');
    this.els.wrapper = document.getElementById('cat-wrapper');
    this.els.mood = document.getElementById('mood-bubble');
    this.els.nameDisplay = document.getElementById('cat-name-display');
    this.els.hungerFill = document.getElementById('hunger-fill');
    this.els.happyFill = document.getElementById('happy-fill');
    this.els.hungerValue = document.getElementById('hunger-value');
    this.els.happyValue = document.getElementById('happy-value');
    this.els.hungerBarBg = this.els.hungerFill.parentElement;
    this.els.heartsLayer = document.getElementById('hearts-layer');
    this.els.crumbsLayer = document.getElementById('crumbs-layer');
    this.els.feedBtn = document.getElementById('btn-feed');
    this.els.petBtn = document.getElementById('btn-pet');
    this.els.sleepBtn = document.getElementById('btn-sleep');
    this.els.sleepCard = document.getElementById('sleep-card');
    this.els.sleepImg = document.getElementById('sleep-scene-img');
  },

  moodFor(hunger, happy){
    if(hunger < 15) return {emoji: '😿', label: 'sad'};
    if(hunger < 40) return {emoji: '😾', label: 'sad'};
    if(happy > 70 && hunger > 60) return {emoji: '😻', label: 'happy'};
    if(hunger >= 40 && hunger <= 70) return {emoji: '😺', label: 'idle'};
    return {emoji: '😸', label: 'idle'};
  },

  render(state){
    this.els.nameDisplay.textContent = state.name || 'Miau';
    this.els.hungerValue.textContent = Math.round(state.hunger);
    this.els.happyValue.textContent = Math.round(state.happy);
    this.els.hungerFill.style.width = state.hunger + '%';
    this.els.happyFill.style.width = state.happy + '%';

    this.els.hungerBarBg.classList.toggle('critical', state.hunger < 20);
    this.els.feedBtn.classList.toggle('attention', state.hunger < 35 && !state.sleeping);

    // ---- Roupa: troca o sprite acordado/dormindo conforme a roupa vestida ----
    const outfit = (typeof Shop !== 'undefined') ? Shop.getOutfit(state.equippedOutfit) : null;
    if(outfit){
      if(this.els.sprite.dataset.outfit !== outfit.id){
        this.els.sprite.src = outfit.catSprite;
        this.els.sprite.dataset.outfit = outfit.id || '';
      }
      if(this.els.sleepImg && this.els.sleepImg.dataset.outfit !== outfit.id){
        this.els.sleepImg.src = outfit.sleepScene;
        this.els.sleepImg.dataset.outfit = outfit.id || '';
      }
    }

    // ---- Dormindo: troca a cena inteira do gato ----
    const sleeping = !!state.sleeping;
    this.els.wrapper.classList.toggle('hidden-el', sleeping);
    this.els.sleepCard.classList.toggle('active', sleeping);
    this.els.feedBtn.disabled = sleeping;
    this.els.petBtn.disabled = sleeping;
    if(this.els.sleepBtn){
      this.els.sleepBtn.textContent = sleeping ? '☀️ Acordar' : '😴 Dormir';
    }

    if(sleeping){
      if(this.els.mood.textContent !== '😴'){
        this.els.mood.textContent = '😴';
        this.els.mood.classList.remove('pop');
        void this.els.mood.offsetWidth;
        this.els.mood.classList.add('pop');
      }
      return;
    }

    const mood = this.moodFor(state.hunger, state.happy);
    if(this.els.mood.textContent !== mood.emoji){
      this.els.mood.textContent = mood.emoji;
      this.els.mood.classList.remove('pop');
      void this.els.mood.offsetWidth; // reinicia a animação
      this.els.mood.classList.add('pop');
    }

    // Só troca a classe de humor "de repouso" se não houver uma animação de ação tocando
    if(!this.els.sprite.classList.contains('_action')){
      this.els.sprite.classList.remove('idle', 'sad');
      this.els.sprite.classList.add(mood.label === 'sad' ? 'sad' : 'idle');
    }
  },

  playAction(name, duration){
    const sprite = this.els.sprite;
    sprite.classList.add('_action');
    sprite.classList.remove('idle', 'happy', 'eating', 'sad', 'petting');
    sprite.classList.add(name);
    clearTimeout(this._actionTimer);
    this._actionTimer = setTimeout(() => {
      sprite.classList.remove(name, '_action');
    }, duration);
  },

  // ---- Efeito "cheiroso e rosinha" ao dar a poção ----
  blush(duration = 5000){
    const wrapper = this.els.wrapper;
    wrapper.classList.remove('blushing');
    void wrapper.offsetWidth;
    wrapper.classList.add('blushing');
    this.spawnHearts(3);
    clearTimeout(this._blushTimer);
    this._blushTimer = setTimeout(() => {
      wrapper.classList.remove('blushing');
    }, duration);
  },

  spawnHearts(count = 5){
    const layer = this.els.heartsLayer;
    const rect = this.els.wrapper.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const originX = rect.left - layerRect.left + rect.width / 2;
    const originY = rect.top - layerRect.top + rect.height * 0.25;

    for(let i = 0; i < count; i++){
      const heart = document.createElement('span');
      heart.className = 'heart-particle';
      heart.textContent = Utils.choice(['💛', '💕', '✨']);
      heart.style.left = (originX + Utils.rand(-30, 30)) + 'px';
      heart.style.top = originY + 'px';
      heart.style.setProperty('--dx', Utils.rand(-40, 40) + 'px');
      heart.style.animationDelay = (i * 60) + 'ms';
      layer.appendChild(heart);
      setTimeout(() => heart.remove(), 1400);
    }
  },

  spawnCrumbs(count = 8){
    const layer = this.els.crumbsLayer;
    const rect = this.els.wrapper.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const originX = rect.left - layerRect.left + rect.width / 2;
    const originY = rect.top - layerRect.top + rect.height * 0.5;

    for(let i = 0; i < count; i++){
      const crumb = document.createElement('span');
      crumb.className = 'crumb-particle';
      crumb.textContent = Utils.choice(['🍞', '✨', '⭐']);
      crumb.style.left = originX + 'px';
      crumb.style.top = originY + 'px';
      crumb.style.setProperty('--dx', Utils.rand(-70, 70) + 'px');
      crumb.style.setProperty('--dy', Utils.rand(-60, 10) + 'px');
      crumb.style.setProperty('--rot', Utils.rand(-180, 180) + 'deg');
      layer.appendChild(crumb);
      setTimeout(() => crumb.remove(), 800);
    }
  }
};
