# Pokémon Face Scan

Reconhecimento facial no navegador que escaneia o seu rosto pela webcam e diz **qual Pokémon você seria**.

Inspirado em projetos de visão computacional com MediaPipe (como o *AI Squat Coach*): a IA rastreia pontos do corpo — aqui, **478 pontos do rosto** — mede o que eles indicam em tempo real e dá um resultado falado.

## Como funciona

1. **Detecção facial** — o [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) encontra o rosto e desenha a malha de pontos ao vivo.
2. **Medição** — a cada quadro são calculados 5 traços (0–100%):
   | Traço | Como é medido |
   |---|---|
   | Sorriso | blendshapes `mouthSmileLeft/Right` |
   | Olhos abertos | inverso de `eyeBlinkLeft/Right` |
   | Sobrancelhas erguidas | `browInnerUp` |
   | Boca aberta | `jawOpen` |
   | Rosto arredondado | largura ÷ altura do rosto (pontos 234–454 e 10–152) |
3. **Scan** — ao clicar em *Escanear*, os traços são medidos por 3 segundos e tirada a média.
4. **Pokédex** — abaixo da câmera há a lista dos **151 Pokémon da 1ª geração**, com tipos e personalidade; o seu resultado fica destacado. Clique num card para abrir a **ficha completa**: tipos, personalidade, rosto típico, perfil facial e altura, peso e habilidades (buscados ao vivo na [PokeAPI](https://pokeapi.co)).
5. **Resultado** — cada um dos 151 Pokémon tem um perfil com os mesmos 5 traços; vence o mais próximo do seu rosto (distância euclidiana). A tela mostra a arte oficial, a compatibilidade e o resultado é falado em português.

Tudo roda **no seu computador**: nenhuma imagem da câmera é enviada para servidor algum.

## Estrutura

```
PokemonFacialDetect/
├── README.md
├── server/
│   └── server.py        # servidor local (Python, só biblioteca padrão)
└── web/
    ├── index.html       # página
    ├── css/
    │   └── style.css    # visual Pokédex: degradês, cortes diagonais, 3D e animações
    ├── img/
    │   └── pokeball.svg # Pokébola (logo, botão e ícone da aba)
    └── js/
        ├── app.js       # câmera, detecção facial, painel e scan
        ├── dex.js       # Pokédex: cards e ficha de cada Pokémon
        ├── effects.js   # paralaxe e inclinação 3D que seguem o mouse
        ├── info.js      # tipos e personalidade dos 151 Pokémon
        └── pokemon.js   # traços, perfis dos 151 Pokémon e cálculo do resultado
tests/
├── info.test.mjs        # confere tipos e personalidade dos 151
└── pokemon.test.mjs     # confere a lista e que todo Pokémon pode ser resultado
```

Testes: `node tests/pokemon.test.mjs && node tests/info.test.mjs`

## Como rodar

Requisitos: Python 3 e Chrome (ou Safari/Edge) com webcam.

```bash
python3 server/server.py
```

O navegador abre em http://localhost:8765. Clique em **Permitir** quando ele pedir a câmera.

### A câmera não aparece?

- **No navegador:** clique no ícone à esquerda do endereço → *Câmera* → *Permitir* e recarregue.
- **No macOS:** Ajustes do Sistema → Privacidade e Segurança → Câmera → ative o navegador e reabra-o.
- Abrir o `index.html` direto (file://) não funciona: use o servidor.

## Personalizar

- **Adicionar Pokémon:** inclua uma linha em `POKEMON` no arquivo `web/js/pokemon.js` com o número da Pokédex, nome, perfil `[sorriso, olhos, sobrancelha, boca, redondo]` e uma descrição.
- **Duração do scan:** altere `SCAN_MS` em `web/js/app.js`.

## Créditos

- Detecção facial: [MediaPipe](https://developers.google.com/mediapipe) (Google)
- Artes dos Pokémon: [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Pokémon é marca registrada da Nintendo / Game Freak / The Pokémon Company; projeto apenas para diversão.
