# Game Design Document: Anything Arcade

| **Project Name** | Anything Arcade |
| --- | --- |
| **Genre** | Platform Fighter / Brawler [cite: 2, 39] |
| **Perspective** | 2D Fixed Screen (Side View) [cite: 2, 40] |
| **Players** | 2 to 4 (Local Multiplayer on one screen/keyboard) [cite: 3, 41] |
| **Platform** | Web Browser (Local HTML5/Canvas) [cite: 3, 42] |
| **Input** | 3 to 4 Custom Keys per player (Up, Left, Right, Attack) [cite: 4, 42, 50, 71] |

---

## 1. Summary
**Anything Arcade** is a chaotic, highly customizable platform fighter designed to be played locally in a web browser [cite: 5, 43]. Players share a single keyboard or plug in multiple controllers, battling it out to increase their opponents' knockback multiplier and launch them off the screen [cite: 6, 44]. The game thrives on its unique AI integration and hyper-accessible controls [cite: 7, 45]. Players design their fighters using text prompts or image uploads that the AI maps onto a standard 2D collision skeleton [cite: 8, 46]. Before the match, players also queue up custom, AI-generated weapons to spawn at specific timestamps [cite: 9, 47]. 

---

## 2. Gameplay Overview
The gameplay experience revolves around physics-driven combat and generative personalization. 

### 2.1 Core Loop
1. **Input Binding & Creation:** Players define their input keys (Up, Left, Right, optional Attack) [cite: 11, 50]. They then prompt the AI to generate their fighter's visual design [cite: 12, 51] and the custom background art for the arena [cite: 52].
2. **Match Start:** Players enter the browser-based arena and begin combat [cite: 13, 53].
3. **Combat:** Players deal damage using a dedicated attack key or via momentum—crashing into opponents at high speeds or stomping on them from above [cite: 14, 54, 55, 71].
4. **Dynamic Item Spawning:** AI-generated weapons drop into the arena at precise timers [cite: 15, 56]. Touching an item automatically equips it, granting passive buffs or altering collision and attack damage [cite: 16, 57].
5. **Elimination:** Players who are knocked past the screen boundaries lose a stock [cite: 17, 58].

---

## 3. Game Mechanics

### 3.1 Controls
* **Movement:** Left and Right keys handle horizontal acceleration [cite: 25, 68, 69]. 
* **Verticality:** The Up key triggers jumps and double jumps for aerial recovery [cite: 26, 70].
* **Attack:** An optional key triggers a primary damage-dealing hitbox [cite: 71].

### 3.2 The Player's Arsenal (AI-Generated Weapons)
* **Pre-Match Queue:** Players type a weapon concept and assign a spawn timer [cite: 21, 64].
* **Generation Process:** The AI generates a 2D sprite of the weapon via API call during the loading screen [cite: 22, 65].
* **Usage:** Colliding with the item attaches it to the player, granting increased mass, wider hitboxes, or elemental damage [cite: 24, 67].

### 3.3 Enemy Units
In local multiplayer, the "enemies" are the other 1-3 human players. The default roster includes digitized versions of the three developers:
* A North East Indian girl.
* A Finnish guy.
* A North Indian boy.

### 3.4 Scoring System
The game uses a Stock and Percentage system similar to classic brawlers [cite: 30, 75]:
| Action | Impact |
| :--- | :--- |
| **Base Collision** | Increases damage percentage [cite: 30, 75, 76]. |
| **Stomping** | Deals high damage and spikes opponents downward [cite: 28, 73]. |
| **High-Speed Dash** | Deals damage based on speed differential [cite: 29, 74]. |
| **Blast Zone KO** | Results in a lost stock [cite: 33, 79]. |

---

## 4. Level Design & Progression

### 4.1 The "World"
* **Boundaries:** The HTML5 Canvas dictates the blast zones (Top, Bottom, Left, Right) [cite: 32, 78]. Exiting the canvas bounds results in a KO [cite: 33, 79].
* **Platforms:** Stages consist of a large horizontal base panel and multiple short panels for vertical movement [cite: 79].

### 4.2 Difficulty Curve
The difficulty is emergent, driven by player mastery of momentum and the unpredictability of AI-generated weapon drops.

---

## 5. Audio & Visuals

### 5.1 Visual Style
* **Custom Characters:** AI extracts visual assets from prompts/images and maps them to a universal 2D physics rig [cite: 19, 60].
* **Custom Battlefield:** AI generates a 2D image that serves as the visual background layer based on player prompts [cite: 62, 63].

### 5.2 Sound Effects
Reactive audio cues for collisions, attacks, and eliminations.

---

## 6. Technical Specifications
* **Engine:** HTML5 Canvas with JavaScript/TypeScript [cite: 34, 80]. **Phaser.js** is recommended for momentum and collision logic [cite: 35, 81].
* **Input Handling:** JavaScript event listeners to capture simultaneous keystrokes from a single keyboard [cite: 36, 82].
* **AI API Integration:** Asynchronous fetch requests for real-time asset generation, caching image URLs locally [cite: 37, 83].

---

## 7. Unique Selling Points (USPs)
1. **Infinite Arena Variety:** Turn any photo into a playable combat zone.
2. **Momentum-Centric Brawling:** A deep physics system that rewards movement over complex combos.
3. **Prompt-Powered Arsenal:** Players "engineer" their own advantages through creative text prompts.
