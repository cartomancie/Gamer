// ---------- shop.js ----------
// Controla a mochila: aba Mercado (comprar itens) e aba Itens (usar/dar ao gato).

const SHOP_ITEMS = [
  {
    id: 'potion',
    name: 'Poção Moyai',
    price: 15,
    icon: 'assets/potion.png',
    desc: 'Deixa seu gatinho cheiroso e rosinha por alguns segundos.'
  }
];

const Shop = {
  els: {},
  activeTab: 'market',

  init(getState, onChange){
    this.getState = getState;
    this.onChange = onChange;

    this.els.btnOpen = document.getElementById('btn-backpack');
    this.els.overlay = document.getElementById('backpack-modal');
    this.els.btnClose = document.getElementById('btn-close-backpack');
    this.els.tabBtns = document.querySelectorAll('.tab-btn');
    this.els.panelMarket = document.getElementById('tab-market');
    this.els.panelItems = document.getElementById('tab-items');
    this.els.modalCoins = document.getElementById('modal-coins');
    this.els.itemsEmpty = document.getElementById('items-empty');
    this.els.badge = document.getElementById('potion-badge');

    this.els.btnOpen.addEventListener('click', () => this.open());
    this.els.btnClose.addEventListener('click', () => this.close());
    this.els.overlay.addEventListener('click', (e) => {
      if(e.target === this.els.overlay) this.close();
    });

    this.els.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    this._renderMarket();
    this.renderAll();
  },

  open(){
    Sound.click();
    this.renderAll();
    this.els.overlay.classList.add('active');
  },

  close(){
    this.els.overlay.classList.remove('active');
  },

  switchTab(tab){
    this.activeTab = tab;
    this.els.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    this.els.panelMarket.classList.toggle('active', tab === 'market');
    this.els.panelItems.classList.toggle('active', tab === 'items');
    if(tab === 'items') this._renderItems();
  },

  renderAll(){
    const state = this.getState();
    this.els.modalCoins.textContent = state.coins;
    this._renderMarket();
    this._renderItems();
    this._renderBadge();
  },

  _renderBadge(){
    const state = this.getState();
    const count = state.inventory.potion || 0;
    if(count > 0){
      this.els.badge.hidden = false;
      this.els.badge.textContent = count;
    }else{
      this.els.badge.hidden = true;
    }
  },

  _renderMarket(){
    const state = this.getState();
    this.els.panelMarket.innerHTML = '';
    SHOP_ITEMS.forEach(item => {
      const canAfford = state.coins >= item.price;
      const card = document.createElement('div');
      card.className = 'shop-item';
      card.innerHTML = `
        <img class="shop-item-img" src="${item.icon}" alt="${item.name}">
        <div class="shop-item-info">
          <b>${item.name}</b>
          <p>${item.desc}</p>
        </div>
        <button class="btn btn-primary btn-buy" ${canAfford ? '' : 'disabled'}>${item.price} 🪙</button>
      `;
      card.querySelector('.btn-buy').addEventListener('click', () => this.buy(item.id));
      this.els.panelMarket.appendChild(card);
    });
  },

  _renderItems(){
    const state = this.getState();
    this.els.panelItems.innerHTML = '';
    this.els.panelItems.appendChild(this.els.itemsEmpty);

    const owned = SHOP_ITEMS.filter(item => (state.inventory[item.id] || 0) > 0);
    this.els.itemsEmpty.style.display = owned.length ? 'none' : 'block';

    owned.forEach(item => {
      const count = state.inventory[item.id] || 0;
      const card = document.createElement('div');
      card.className = 'inv-item';
      card.innerHTML = `
        <img class="inv-item-img" src="${item.icon}" alt="${item.name}">
        <div class="inv-item-info"><b>${item.name}</b><span>x<span class="inv-count">${count}</span></span></div>
        <button class="btn btn-secondary btn-give">Dar ao gatinho 🐾</button>
      `;
      const img = card.querySelector('.inv-item-img');
      card.querySelector('.btn-give').addEventListener('click', () => this.giveToCat(item.id, img));
      this.els.panelItems.appendChild(card);
    });
  },

  buy(itemId){
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const state = this.getState();
    if(!item || state.coins < item.price){
      Sound.sad();
      Utils.showToast('Moedas insuficientes! Alimente seu gatinho para ganhar mais 🪙');
      return;
    }
    state.coins -= item.price;
    state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
    Sound.buy();
    Utils.showToast(`${item.name} comprada! 🎉`);
    this.onChange();
    this.renderAll();
  },

  giveToCat(itemId, imgEl){
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const state = this.getState();
    if(!item || (state.inventory[itemId] || 0) <= 0) return;

    // Guarda a posição/imagem do item AGORA, porque renderAll() vai
    // reconstruir a lista e apagar o elemento original do DOM.
    const startRect = imgEl.getBoundingClientRect();
    const iconSrc = imgEl.src;

    state.inventory[itemId]--;

    // Se o gato estiver dormindo, acorda com a poção :)
    const wasSleeping = state.sleeping;
    state.sleeping = false;

    // Atualiza a UI (e "acorda" o gato no DOM) ANTES de medir a posição dele,
    // senão o cálculo do voo do item pega um elemento ainda escondido.
    this.onChange();
    this.renderAll();
    this._flyToCat(startRect, iconSrc);

    setTimeout(() => {
      this.close();
      Cat.playAction('eating', 900);
      Cat.blush(5000);
      Sound.feedComplete();
      state.happy = Utils.clamp(state.happy + 15, 0, 100);
      this.onChange();
      Utils.showToast(`${state.name || 'Seu gatinho'} ficou cheiroso e rosinha! 💗`);
      if(wasSleeping) Utils.showToast(`${state.name || 'Seu gatinho'} acordou! ☀️`);
    }, 650);
  },

  // Anima o ícone do item "voando" até a boca do gatinho
  _flyToCat(startRect, iconSrc){
    if(!startRect || !startRect.width) return;
    const catEl = document.getElementById('cat-sprite');
    const catRect = catEl.getBoundingClientRect();

    const flying = document.createElement('img');
    flying.src = iconSrc;
    flying.className = 'flying-item';
    flying.style.left = startRect.left + 'px';
    flying.style.top = startRect.top + 'px';
    flying.style.width = startRect.width + 'px';
    document.body.appendChild(flying);

    const endX = catRect.left + catRect.width * 0.5 - startRect.width / 2;
    const endY = catRect.top + catRect.height * 0.35 - startRect.width / 2;

    requestAnimationFrame(() => {
      flying.style.transform = `translate(${endX - startRect.left}px, ${endY - startRect.top}px) scale(.3) rotate(20deg)`;
      flying.style.opacity = '0.2';
    });

    setTimeout(() => flying.remove(), 700);
  }
};
