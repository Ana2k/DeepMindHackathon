import Phaser from 'phaser';
import { GameScene } from './game.js';
import { GoogleGenAI } from '@google/genai';
import { generateSprites, checkSpriteServer } from './SpritePipeline.js';

// ═══════════════════════════════════════════════
// FUN FACTS — shown during loading
// ═══════════════════════════════════════════════
const FUN_FACTS = [
  "Street Fighter II was released in 1991 and sparked the fighting game craze!",
  "The Konami Code (↑↑↓↓←→←→BA) was created in 1986 for Gradius.",
  "Mario was originally called 'Jumpman' in the 1981 Donkey Kong arcade.",
  "The first pixel art dates back to 1972 with the game Pong!",
  "Pac-Man was originally called 'Puck Man' in Japan.",
  "An AI generated your custom sprites using Gemini — the future is now!",
  "The SNES could display 256 colors from a palette of 32,768.",
  "Mortal Kombat sparked the creation of the ESRB rating system in 1994.",
  "The Game Boy's screen had only 4 shades of green!",
  "Each of your sprites is snapped to a 32×32 pixel grid for authenticity.",
  "The original Street Fighter only had two playable characters!",
  "Sonic the Hedgehog was designed to be played in 15-minute sessions.",
  "Your sprites use a maximum of 6 colors — just like classic 8-bit games!",
  "The NES could only show 25 colors on screen at the same time.",
  "Double Dragon (1987) pioneered the side-scrolling beat 'em up genre.",
  "In 1993, Doom ran at 35 frames per second — considered blazing fast!",
  "Tetris has sold over 500 million copies across all platforms.",
  "The AI analyzes your photo and describes you as a pixel art character!",
];

let funFactInterval = null;

function startFunFacts() {
  const el = document.getElementById('fun-fact-text');
  let lastIdx = -1;
  const rotate = () => {
    let idx;
    do { idx = Math.floor(Math.random() * FUN_FACTS.length); } while (idx === lastIdx);
    lastIdx = idx;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = FUN_FACTS[idx];
      el.style.opacity = '1';
    }, 300);
  };
  rotate();
  funFactInterval = setInterval(rotate, 4000);
}

function stopFunFacts() {
  if (funFactInterval) clearInterval(funFactInterval);
}

function setProgress(pct) {
  document.getElementById('progress-bar').style.width = `${Math.min(100, pct)}%`;
}

function setLoadingText(msg) {
  document.getElementById('loading-text').textContent = msg;
}

// ═══════════════════════════════════════════════
// PREVIEW UPLOADS
// ═══════════════════════════════════════════════
function setupPreview(inputId, containerId, imgId) {
  document.getElementById(inputId).addEventListener('change', (e) => {
    const file = e.target.files[0];
    const container = document.getElementById(containerId);
    const img = document.getElementById(imgId);
    if (file) {
      img.src = URL.createObjectURL(file);
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  });
}

setupPreview('p1-sprite-image', 'p1-sprite-preview-container', 'p1-sprite-preview');
setupPreview('p2-sprite-image', 'p2-sprite-preview-container', 'p2-sprite-preview');

// ═══════════════════════════════════════════════
// CHECK SPRITE SERVER
// ═══════════════════════════════════════════════
(async () => {
  const statusEl = document.getElementById('sprite-server-status');
  const isUp = await checkSpriteServer();
  if (isUp) {
    statusEl.textContent = '● SERVER ONLINE';
    statusEl.style.color = '#00cc00';
  } else {
    statusEl.textContent = '✕ SERVER OFFLINE';
    statusEl.style.color = '#ff4444';
  }
})();

// ═══════════════════════════════════════════════
// START GAME
// ═══════════════════════════════════════════════
document.getElementById('start-btn').addEventListener('click', async () => {
  const p1Controls = {
    up: document.getElementById('p1-up').value.toUpperCase(),
    left: document.getElementById('p1-left').value.toUpperCase(),
    right: document.getElementById('p1-right').value.toUpperCase(),
    attack: document.getElementById('p1-attack').value.toUpperCase()
  };

  const p2Controls = {
    up: document.getElementById('p2-up').value.toUpperCase(),
    left: document.getElementById('p2-left').value.toUpperCase(),
    right: document.getElementById('p2-right').value.toUpperCase(),
    attack: document.getElementById('p2-attack').value.toUpperCase()
  };

  const bgPrompt = document.getElementById('bg-prompt').value;
  const bgImageFile = document.getElementById('bg-image').files[0];
  const p1SpriteFile = document.getElementById('p1-sprite-image').files[0];
  const p2SpriteFile = document.getElementById('p2-sprite-image').files[0];

  // Switch to loading screen
  document.getElementById('menu-container').style.display = 'none';
  document.getElementById('loading-screen').style.display = 'flex';
  startFunFacts();
  setProgress(5);

  // ————— 1. Generate P1 Sprites —————
  let p1Sprites = null;
  if (p1SpriteFile) {
    try {
      setLoadingText('GENERATING P1 SPRITES...');
      setProgress(10);
      p1Sprites = await generateSprites(p1SpriteFile, (msg) => {
        setLoadingText(`P1: ${msg.toUpperCase()}`);
      });
      setProgress(35);
    } catch (err) {
      console.error('P1 sprite generation failed:', err);
      setLoadingText('P1 FAILED — USING DEFAULTS');
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  setProgress(40);

  // ————— 2. Generate P2 Sprites —————
  let p2Sprites = null;
  if (p2SpriteFile) {
    try {
      setLoadingText('GENERATING P2 SPRITES...');
      setProgress(45);
      p2Sprites = await generateSprites(p2SpriteFile, (msg) => {
        setLoadingText(`P2: ${msg.toUpperCase()}`);
      });
      setProgress(70);
    } catch (err) {
      console.error('P2 sprite generation failed:', err);
      setLoadingText('P2 FAILED — USING DEFAULTS');
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  setProgress(75);

  // ————— 3. Generate Background —————
  setLoadingText('GENERATING ARENA...');

  let bgUrl = '/assets/backgrounds/bg.svg';
  let base64Image = null;
  let imageMimeType = null;

  if (bgImageFile) {
    imageMimeType = bgImageFile.type;
    base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(bgImageFile);
    });
  }

  if (bgPrompt.trim() || base64Image) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const parts = [];
      if (base64Image) {
        parts.push({ inlineData: { data: base64Image, mimeType: imageMimeType } });
      }
      if (bgPrompt.trim()) {
        parts.push({ text: bgPrompt });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts }],
        config: { responseModalities: ['IMAGE'] }
      });

      const part = response.candidates[0]?.content?.parts[0];
      if (part && part.inlineData) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        bgUrl = `data:${mimeType};base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error('Background generation failed, using fallback.', e);
    }
  }

  setProgress(95);
  setLoadingText('GET READY...');
  await new Promise(r => setTimeout(r, 800));
  setProgress(100);
  await new Promise(r => setTimeout(r, 400));

  // ————— 4. Launch Game —————
  stopFunFacts();
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  window.gameSettings = {
    p1Controls,
    p2Controls,
    bgUrl,
    p1Sprites,
    p2Sprites
  };

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1200 },
        debug: false
      }
    },
    scene: [GameScene]
  };

  new Phaser.Game(config);
});