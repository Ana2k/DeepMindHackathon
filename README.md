# Anything Arcade

Anything Arcade is an innovative, AI-powered platform fighter that integrates 1990s arcade-style gameplay with modern generative AI. By leveraging the Google Gemini model family, the application enables users to generate custom fighters and interactive environments through multimodal inputs.

---

## Pillar Technical Features

### 1. Dynamic Arena Generation (Implemented)
Anything Arcade utilizes generative AI to transform static game stages into dynamic environments.
- **Implementation**: The system uses **Gemini 2.5-Flash** to process multimodal inputs. Users can provide text-based descriptions or upload photographic seeds. The AI synthesizes a high-fidelity 2D background, while the game engine programmatically maps secondary collision layers.

### 2. Character Sprite Pipeline (Implemented)
The core technical innovation is the automated conversion of high-resolution user photographs into performance-optimized 16-bit pixel art.
- **Analysis and Feature Extraction**: **Gemini 2.5-Flash** performs an initial analysis of the source photograph to extract character-specific "style DNA" (including anatomical structure and color palette constants). This ensures visual consistency across all animation states.
- **Frame Synthesis**: The system generates four distinct animation frames (Idle, Walk, Punch, Jump) using **Gemini-3-Pro-Image-Preview**. A 32x32 pixel grid is provided as a visual reference, ensuring character dimensions remain proportional to the game environment.
- **Post-Processing and Optimization**: 
    - **Grid Conformance**: A custom PIL-based algorithm samples the AI output to enforce perfect 32x32 alignment, removing artifacts and anti-aliasing.
    - **Color Synchronization**: The system extracts a limited color palette from the initial frame and programmatically enforces it across all subsequent frames to prevent visual inconsistency.
    - **Vector Serialization**: Final assets are converted into optimized SVG strings for zero-latency loading within the Phaser.js engine.

### 3. Prompt-Driven Weapons (Roadmap)
A conceptualized feature designed to allow users to engineer tactical advantages.
- **Concept**: Future iterations will enable users to generate weapons via text prompts. The AI will define physical properties such as mass, hitbox coordinates, and damage modifiers.
- **Status**: The underlying architecture supports dynamic spawning; however, this feature is currently in the late-stage design phase.

---

## Technical Architecture

### Development Methodology
Anything Arcade was developed using an accelerated integration workflow focused on rapid architectural drafting and system unification via the Gemini family of models.

### Backend: Sprite Generation Pipeline
- **Stack**: Python, Flask, PIL (Pillow), Google GenAI SDK, python-dotenv.
- **Operational Sequence**: 
  1. Image Ingestion
  2. Character DNA Extraction
  3. Sequential Frame Generation (Idle, Walk, Punch, Jump)
  4. Grid/Color Optimization
  5. Manifest Serialization.

### Frontend: Engine and Interface
- **Stack**: Phaser.js (Arcade Physics Engine), Vite, Standard CSS.
- **Features**: 
    - **Arcade Interface**: 16-bit visual design featuring segmented health tracking and traditional arcade typography.
    - **Physics Model**: Momentum-centric mechanics where velocity is mapped directly to knockback magnitude.
    - **Dynamic Loading**: An interactive loading screen provides historical arcade context during AI processing cycles.

---

## Installation and Deployment

### 1. Frontend Dependencies
```bash
npm install
```

### 2. Backend Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory and configure the API key:
```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Application Launch
```bash
npm start
```
*This command executes the Vite development server and the Python sprite server concurrently.*


### 5. Outcome Images

We enter the prompt for the background and upload images for our sprites
<img width="700" height="616" alt="Screenshot 2026-02-22 at 0 29 58" src="https://github.com/user-attachments/assets/40820f3d-a057-4d40-864b-029d05126c0b" />

Followed by fighting with the characters in said space. 
<img width="1139" height="605" alt="Screenshot 2026-02-21 at 23 57 12" src="https://github.com/user-attachments/assets/5bb806ab-067e-4b23-8907-4079b07d4638" />

Here is the cutest one, with a background i loved. 
<img width="2258" height="1202" alt="image" src="https://github.com/user-attachments/assets/2a26f941-aaad-4166-a242-4dc4d429f1ba" />

A tribute to my nostalgia of early 200s arcade games. 



