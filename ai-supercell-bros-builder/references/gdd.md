# Game Design Document: AI Supercell Bros

| **Project Name** | AI Supercell Bros |
| --- | --- |
| **Genre** | Platform Fighter / Brawler |
| **Perspective** | 2D Fixed Screen (Side View) |
| **Players** | 2 to 4 (Local Multiplayer on one screen/keyboard) |
| **Platform** | Web Browser (Local HTML5/Canvas) |
| **Input** | 3 to 4 Custom Keys per player (Up, Left, Right, Attack) |

---

## 1. Summary
**AI Supercell Bros** is a chaotic, highly customizable platform fighter designed to be played locally in a web browser. Players share a single keyboard or plug in multiple controllers, battling it out to increase their opponents' knockback multiplier and launch them off the screen. The game thrives on its unique AI integration and hyper-accessible controls. Players design their fighters using text prompts or image uploads that the AI maps onto a standard 2D collision skeleton. Before the match, players also queue up custom, AI-generated weapons to spawn at specific timestamps.

---

## 2. Gameplay Overview
The gameplay experience revolves around physics-driven combat and generative personalization.

### 2.1 Core Loop
1. **Input Binding & Creation:** Players define their input keys (Up, Left, Right, optional Attack). They then prompt the AI to generate their fighter's visual design and the custom background art for the arena.
2. **Match Start:** Players enter the browser-based arena and begin combat.
3. **Combat:** Players deal damage using a dedicated attack key or via momentum—crashing into opponents at high speeds or stomping on them from above.
4. **Dynamic Item Spawning:** AI-generated weapons drop into the arena at precise timers. Touching an item automatically equips it, granting passive buffs or altering collision and attack damage.
5. **Elimination:** Players who are knocked past the screen boundaries lose a stock.

---

## 3. Game Mechanics

### 3.1 Controls
* **Movement:** Left and Right keys handle horizontal acceleration.
* **Verticality:** The Up key triggers jumps and double jumps for aerial recovery.
* **Attack:** An optional key triggers a primary damage-dealing hitbox.

### 3.2 The Player's Arsenal (AI-Generated Weapons)
* **Pre-Match Queue:** Players type a weapon concept and assign a spawn timer.
* **Generation Process:** The AI generates a 2D sprite of the weapon via API call during the loading screen.
* **Usage:** Colliding with the item attaches it to the player, granting increased mass, wider hitboxes, or elemental damage.

### 3.3 Enemy Units
In local multiplayer, the "enemies" are the other 1-3 human players. The default roster includes digitized versions of the three developers:
* A North East Indian girl.
* A Finnish guy.
* A North Indian boy.

### 3.4 Scoring System
The game uses a Stock and Percentage system similar to classic brawlers:
| Action | Impact |
| :--- | :--- |
| **Base Collision** | Increases damage percentage. |
| **Stomping** | Deals high damage and spikes opponents downward. |
| **High-Speed Dash** | Deals damage based on speed differential. |
| **Blast Zone KO** | Results in a lost stock. |

---

## 4. Level Design & Progression

### 4.1 The "World"
* **Boundaries:** The HTML5 Canvas dictates the blast zones (Top, Bottom, Left, Right). Exiting the canvas bounds results in a KO.
* **Platforms:** Stages consist of a large horizontal base panel and multiple short panels for vertical movement.

### 4.2 Difficulty Curve
The difficulty is emergent, driven by player mastery of momentum and the unpredictability of AI-generated weapon drops.

---

## 5. Audio & Visuals

### 5.1 Visual Style
* **Custom Characters:** AI extracts visual assets from prompts/images and maps them to a universal 2D physics rig.
* **Custom Battlefield:** AI generates a 2D image that serves as the visual background layer based on player prompts.

### 5.2 Sound Effects
Reactive audio cues for collisions, attacks, and eliminations.

---

## 6. Technical Specifications
* **Engine:** HTML5 Canvas with JavaScript/TypeScript. **Phaser.js** is recommended for momentum and collision logic.
* **Input Handling:** JavaScript event listeners to capture simultaneous keystrokes from a single keyboard.
* **AI API Integration:** Asynchronous fetch requests for real-time asset generation, caching image URLs locally.

---

## 7. Unique Selling Points (USPs)
1. **Infinite Arena Variety:** Turn any photo into a playable combat zone.
2. **Momentum-Centric Brawling:** A deep physics system that rewards movement over complex combos.
3. **Prompt-Powered Arsenal:** Players "engineer" their own advantages through creative text prompts.
