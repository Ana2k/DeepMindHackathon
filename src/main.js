import Phaser from 'phaser';
import { GameScene } from './game.js';
import { GoogleGenAI } from '@google/genai';
import { generateSprites, checkSpriteServer } from './SpritePipeline.js';

// — Preview uploaded P1 image —
document.getElementById('p1-sprite-image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const previewContainer = document.getElementById('p1-sprite-preview-container');
  const previewImg = document.getElementById('p1-sprite-preview');
  if (file) {
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewContainer.style.display = 'block';
  } else {
    previewContainer.style.display = 'none';
  }
});

// — Check sprite server health on load —
(async () => {
  const statusEl = document.getElementById('p1-server-status');
  const isUp = await checkSpriteServer();
  if (isUp) {
    statusEl.textContent = '✅ Sprite server connected';
    statusEl.style.color = '#4caf50';
  } else {
    statusEl.textContent = '⚠️ Sprite server not running (run: python sprite_server.py)';
    statusEl.style.color = '#ff9800';
  }
})();

// — Start game —
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

  // Show loading
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  const loadingText = document.getElementById('loading-text');

  // ——————————————————————————————
  // 1. Generate Player 1 Custom Sprites (if photo uploaded)
  // ——————————————————————————————
  let p1Sprites = null;

  if (p1SpriteFile) {
    try {
      loadingText.textContent = 'Starting sprite generation...';
      p1Sprites = await generateSprites(p1SpriteFile, (msg) => {
        loadingText.textContent = msg;
      });
      console.log('✅ Custom P1 sprites generated:', p1Sprites);
    } catch (err) {
      console.error('❌ Sprite generation failed, using defaults:', err);
      loadingText.textContent = 'Sprite generation failed, using defaults...';
      p1Sprites = null;
      // Brief pause so user can see the message
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // ——————————————————————————————
  // 2. Generate Background
  // ——————————————————————————————
  loadingText.textContent = 'Generating background...';

  let bgUrl = '/assets/backgrounds/bg.svg'; // fallback
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
        parts.push({
          inlineData: {
            data: base64Image,
            mimeType: imageMimeType
          }
        });
      }
      if (bgPrompt.trim()) {
        parts.push({ text: bgPrompt });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          role: 'user',
          parts: parts
        }],
        config: {
          responseModalities: ['IMAGE']
        }
      });

      const part = response.candidates[0]?.content?.parts[0];
      if (part && part.inlineData) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        const base64Data = part.inlineData.data;
        bgUrl = `data:${mimeType};base64,${base64Data}`;
      } else {
        console.error("Failed to generate image inline data from Gemini API.");
      }
    } catch (e) {
      console.error("Error making request to Gemini API, using fallback.", e);
    }
  }

  // ——————————————————————————————
  // 3. Launch Game
  // ——————————————————————————————
  document.getElementById('menu-container').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  // Make settings globally available to the scene
  window.gameSettings = {
    p1Controls,
    p2Controls,
    bgUrl,
    p1Sprites  // { idle, walk, punch, jump } blob URLs, or null
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