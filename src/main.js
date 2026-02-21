import Phaser from 'phaser';
import { GameScene } from './game.js';
import { GoogleGenAI } from '@google/genai';

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

  // Show loading
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('loading').style.display = 'block';

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

  // Hide menu, show game
  document.getElementById('menu-container').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  // Make settings globally available to the scene
  window.gameSettings = {
    p1Controls,
    p2Controls,
    bgUrl
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