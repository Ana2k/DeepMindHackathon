# 🕹️ Anything Arcade Bros 

**Anything Arcade Bros** is an innovative, AI-powered platform fighter that brings the nostalgic 90s arcade experience into the future. Players can upload any photo or provide a text prompt to generate custom fighters and arenas, creating a truly personalized combat experience.

---

## 🏆 Judging Criteria

### 🌍 Impact (25%)
**What is the project’s long-term potential for success, growth, and impact?**
- **Hyper-Personalization:** By enabling users to turn personal photos, pets, or even inanimate objects into playable characters, Anything Arcade Bros eliminates the "static roster" limitation of traditional fighters.
- **AI-Driven Creativity:** The project demonstrates a seamless integration of Generative AI (Google Gemini) into the game development workflow, lowering the barrier for creator-generated content.
- **Problem Statement Fit:** Addresses the intersection of **Generative AI and Real-time Entertainment**, showing how multimodal models can go beyond text output to generate functional, game-ready assets (SVGs, backgrounds).
- **Target Audience:** Casual gamers, streamers looking for unique interactive content, and collectors of personalized digital assets.

### 🎮 Demo (50%)
**How well has the team implemented the idea? Does it work?**
- **Full Working Repository:** A robust local environment using **Vite + Phaser.js** for the game engine and **Flask** for the backend sprite pipeline.
- **End-to-End Pipeline:**
    1. **Character Generation:** Upload a photo ➔ AI analyzes features ➔ AI generates 4 distinct animation sprites (Idle, Walk, Punch, Jump) ➔ Sprites are snapped to a 32x32 pixel grid ➔ Resulting SVGs are loaded into the game.
    2. **Arena Generation:** Enter a prompt ➔ Gemini generates a high-quality arcade background ➔ Collision platforms are dynamically mapped.
- **Fluid Combat Mechanics:** Implements a momentum-based physics system with:
    - Dynamic health bars and damage percentages.
    - Consistent knockback physics (higher % = more launch).
    - Responsive collision detection and blast zones.
    - Retro "Fatality" style Game Over screens.
- **Visual Excellence:** Extremely polished 90s arcade aesthetic featuring:
    - **Scanline overlays** and chromatic aberration.
    - **Press Start 2P** pixelated typography.
    - **Neon rim lighting** and 3D beveled metallic HUDs.
    - Blinking "INSERT COIN" and "VS" animations.

### 💡 Creativity (15%)
**Is the project’s concept innovative? Is their demo unique?**
- **Vibe-Coding Methodology:** This project was built using a "vibe-coding" approach—prioritizing intent, aesthetics, and rapid iteration over boilerplate. By leveraging **Antigravity** and **Gemini 3-Flash**, the team focused on core gameplay "vibe" and visual polish, allowing for high-impact creative decisions in record time.
- **Prompt-Powered Arsenal:** The concept of "Anything Arcade" means the game is a blank canvas. The innovation lies in the **Sprite Pipeline Server**, which enforces strict pixel-art rules via AI to ensure generated assets look native to the 16-bit era.
- **Dynamic Item Spawning:** Players can "engineer" their advantages by queuing custom, AI-generated weapons that spawn at specific timestamps.

### 🎤 Pitch (10%)
**How effectively does the team present their project?**
Anything Arcade Bros is not just a game; it's a **generative engine for nostalgia**. We've combined the latest in multimodal AI with the timeless fun of platform brawlers. Our pitch focuses on the "WOW" factor of seeing yourself transformed into a pixel-art hero in a custom-built cyberpunk Tokyo alleyway.

---

## 🛠️ Technical Deep Dive

### ✨ The Vibe-Code Stack
Anything Arcade Bros was developed through an accelerated "vibe-coding" workflow using:
- **Antigravity:** The primary AI agent coordinator for rapid architectural drafting and system integration.
- **Gemini 3-Flash:** The high-speed backbone for real-time asset generation and logic validation.
- **Nanobanana:** Orchestration layer used to maintain the "chaos-under-control" development pace.

### 🗄️ Backend: Sprite Pipeline Server
- **Tech:** Python, Flask, PIL (Pillow), Google GenAI SDK.
- **Process:**
    - **Analysis:** Uses **Gemini 3-Flash** to extract character details (hair, clothing, skin).
    - **Generation:** Uses **Gemini 3-Flash** to draw frames based on a `pixel_grid_32x32.png`.
    - **Post-Processing:** Snaps raw AI output to grids, enforces a 6-color palette, and converts to optimized SVGs.

### 🕹️ Frontend: Game Engine
- **Tech:** Phaser.js (Arcade Physics), Vite, Shared-Keyboard Input.
- **Features:** 
    - **Custom HUD:** 3D beveled metallic frames with dynamic health tracking.
    - **Physics:** Momentum-centric brawling that rewards movement over complex combos.
    - **Asset Loading:** Asynchronous fetch requests for real-time asset generation.

### 🎨 Visual Theme
- **Style:** 16-bit Retro Arcade (Neo-Tokyo Aesthetic).
- **Effects:** Scanlines, chromatic aberration, flickering neon, and "Press Start 2P" typography.
- **Assets:** Appropriate 90s arcade style gaming console images and custom-generated sprites.

---

## 🚀 Getting Started
1. Install dependencies: `npm install`
2. Set up your `.env` with `GEMINI_API_KEY`.
3. Start the engine: `npm run dev`
4. **Insert Coin and Fight!**
