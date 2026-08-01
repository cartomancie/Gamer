// ---------- utils.js ----------
// Funções pequenas e reutilizáveis usadas pelo resto do jogo.

const Utils = {
  clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  },

  rand(min, max){
    return Math.random() * (max - min) + min;
  },

  randInt(min, max){
    return Math.floor(this.rand(min, max + 1));
  },

  choice(arr){
    return arr[this.randInt(0, arr.length - 1)];
  },

  showToast(message, duration = 2200){
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },

  showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
  },

  formatSeconds(s){
    return Math.max(0, Math.ceil(s));
  }
};
