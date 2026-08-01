// ---------- storage.js ----------
// Guarda e recupera o estado do bichinho no localStorage do navegador,
// incluindo o cálculo de fome/felicidade perdidas enquanto o jogo estava fechado.

const STORAGE_KEY = 'gatinho-faminto-save-v1';

const HUNGER_DECAY_PER_MIN = 1.4;   // quanto de fome cai por minuto real
const HAPPY_DECAY_PER_MIN  = 0.9;   // quanto de felicidade cai por minuto real

const Storage = {
  getDefaultState(){
    return {
      name: '',
      hunger: 100,
      happy: 100,
      coins: 0,
      lastUpdate: Date.now(),
      totalFed: 0,
      sleeping: false,
      inventory: { potion: 0 },
      outfits: {},          // roupas já compradas, ex: { 'roupa-giy': true }
      equippedOutfit: null  // id da roupa vestida agora (null = original)
    };
  },

  load(){
    let raw;
    try{
      raw = localStorage.getItem(STORAGE_KEY);
    }catch(e){
      return this.getDefaultState();
    }
    if(!raw) return this.getDefaultState();

    let state;
    try{
      state = JSON.parse(raw);
    }catch(e){
      return this.getDefaultState();
    }

    // Aplica decaimento pelo tempo que passou desde a última visita
    // (a não ser que o gatinho estivesse dormindo, aí a fome cai mais devagar)
    const now = Date.now();
    const minutesPassed = Math.max(0, (now - (state.lastUpdate || now)) / 60000);
    const decayFactor = state.sleeping ? 0.25 : 1;
    state.hunger = Utils.clamp(state.hunger - minutesPassed * HUNGER_DECAY_PER_MIN * decayFactor, 0, 100);
    state.happy  = Utils.clamp(state.happy  - minutesPassed * HAPPY_DECAY_PER_MIN * decayFactor, 0, 100);
    state.lastUpdate = now;
    state.coins = state.coins || 0;
    state.totalFed = state.totalFed || 0;
    state.sleeping = !!state.sleeping;
    state.inventory = state.inventory || { potion: 0 };
    state.inventory.potion = state.inventory.potion || 0;
    state.outfits = state.outfits || {};
    state.equippedOutfit = state.equippedOutfit || null;

    return state;
  },

  save(state){
    state.lastUpdate = Date.now();
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){
      // localStorage indisponível (modo privado, etc) - o jogo segue funcionando sem salvar
    }
  },

  reset(){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  }
};
