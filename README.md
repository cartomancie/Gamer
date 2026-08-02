# 🐱 Gatinho Faminto

Um joguinho de cuidar de um gato de estimação, feito só com HTML, CSS e JS puro (sem instalar nada).

## Como jogar
1. Extraia o .zip e abra o arquivo `index.html` no navegador (duplo clique).
2. Na primeira vez, escolha um **nome** para o seu gatinho.
3. Cuide dele na tela principal:
   - As barras de **fome** e **felicidade** caem sozinhas com o tempo.
   - Clique em **"Fazer carinho"** para ganhar um pouco de felicidade.
   - Clique em **"Alimentar"** para escolher entre dois minigames: o de
     **comidinha caindo** ou o **Jogo do Pássaro** (estilo Flappy Bird, com
     moedas para pegar e um morcego 🦇 para desviar). Nos dois você tem
     3 vidas — se perder todas, a partida termina ali.
   - Clique em **"😴 Dormir"** para colocar o gatinho pra dormir — a fome e a
     felicidade caem bem mais devagar enquanto ele descansa. Clique de novo
     ("☀️ Acordar") para acordá-lo.
4. No minigame, toque/clique nas comidinhas que caem antes que elas cheguem ao chão.
   Você tem 3 vidas e 30 segundos. De vez em quando cai um **peixinho bônus** 🐟 —
   pegue-o para ganhar moedas extras (ele não tira vida se cair no chão).
   Ao terminar o minigame alimentando o gato (pelo menos 1 item pego), você ganha
   **25 moedas** fixas, + 10 moedas por peixinho pescado.
5. Clique no botão da **mochila 🎒** (canto inferior direito) para abrir o
   **Mercado** e comprar a **Poção Moyai** por 15 moedas. Depois vá na aba
   **Itens**, clique em "Dar ao gatinho 🐾" — a poção viaja até a boca dele,
   o gatinho fica cheiroso e as bochechas ficam rosinhas por 5 segundos! 💗
6. O progresso é salvo automaticamente no navegador (localStorage), então pode
   fechar e voltar depois — inclusive a fome continua caindo mesmo com o jogo fechado.

## Estrutura dos arquivos
```
gato-game/
├── index.html          → estrutura das telas (nome, casa, mochila, escolher jogo,
│                          minigame de comida, jogo do pássaro, resultado)
├── style.css            → todo o layout, cores, mochila, modal, botões e telas de jogo
├── script.js             → utils, storage, sound, humor do gato, níveis, minigame de
│                            comida, mochila/loja e a orquestração geral das telas
├── birdgame.js            → motor isolado do Jogo do Pássaro (estilo Flappy Bird)
└── (assets na raiz)
    ├── cat.png             → sprite do gatinho (fundo transparente)
    ├── food.png             → sprite da comida
    ├── fish.png              → peixinho bônus que cai no minigame
    ├── tenis-cat.png          → armadilha do minigame de comida
    ├── bat.png                 → morcego do Jogo do Pássaro
    ├── backpack.png             → ícone da mochila
    ├── potion.png / poção-cat.png → poções da loja
    ├── MOEDA-cat.png             → ícone de moeda
    ├── Boy-cat.png / Girl-cat.png → escolha de gatinho na adoção
    ├── roupas e cenas de dormir   → fantasias compráveis na loja (rosa, mey, outono, sapo)
    └── cat-sleep-scene.jpg        → cena do gatinho dormindo
```

## Personalizar
- Trocar velocidade de fome/felicidade: edite `HUNGER_DECAY_PER_MIN` e
  `HAPPY_DECAY_PER_MIN` em `js/storage.js`.
- Trocar duração/dificuldade do minigame: edite `timeLeft`, `lives` e
  `spawnInterval` em `js/minigame.js`.
- Trocar chance de aparecer peixinho bônus: edite o `0.16` em `_spawnItem()`
  dentro de `js/minigame.js`.
- Trocar dificuldade/velocidade do Jogo do Pássaro: edite `GRAVITY`,
  `FLAP_STRENGTH`, `WORLD_SPEED` e `TREE_GAP` no topo de `birdgame.js`.
- Trocar quanto o Jogo do Pássaro rende em moedas: edite o multiplicador
  `coinsCollected * 6` dentro de `finishBirdGame()` em `script.js`.
- Adicionar novos itens na loja: edite o array `SHOP_ITEMS` em `js/shop.js`.
- Trocar sprites: substitua os arquivos em `assets/` por outras imagens
  (de preferência com fundo transparente / PNG).

Divirta-se! 🍞🐾
