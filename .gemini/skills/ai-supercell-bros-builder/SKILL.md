---
name: ai-supercell-bros-builder
description: Instructions, rules, and architecture for building and updating AI Supercell Bros, a 2D HTML5 Canvas platform fighter. Use this when prompted to implement or modify game features, characters, stages, weapons, or UI.
---

# AI Supercell Bros Builder

This skill provides rules, architectural decisions, and guidelines for building and updating the **AI Supercell Bros** web game based on its Game Design Document (GDD).

## Core Architecture
- **Environment**: Web Browser (Local HTML5 Canvas).  
- **Technology**: HTML5, JavaScript/TypeScript, and Vanilla CSS (no TailwindCSS unless specified).
- **Physics Engine**: Phaser.js is recommended for handling momentum, collisions, and platformer mechanics, or custom math if preferred.
- **AI Integration**: The game heavily relies on asynchronous fetch requests for real-time asset generation (weapons, backgrounds, character skins) during loading screens or gameplay. Image URLs should be cached locally.

## Development Workflow
When the user prompts to build or update the game, adhere to this workflow:

1. **Understand Scope**: Determine what system the prompt targets: 
   - **Physics & Combat**: Movement, jumping, stomping, knockback percentage.
   - **Game Loop & State**: Spawning, player stocks, item timers, blast zones.
   - **Input Handling**: Mapping keys (Up, Left, Right, optional Attack) and ensuring simultaneous input detection for local multiplayer.
   - **AI Generation**: Prompt formatting, API fetch logic, mapping generated 2D sprites/images to the standard collision rigs.
2. **Reference the GDD**: For detailed mechanics (e.g., Scoring System, Controls, Level Bounds), consult the [Game Design Document](references/gdd.md).
3. **Execution**:
   - Make surgical changes within the targeted module.
   - For UI/aesthetic updates, maintain the chaotic and customizable vibe using native web primitives.
   - Ensure the HTML5 Canvas scales properly and blast zones (screen boundaries) remain consistent.

## AI Asset Integration Guidelines
When implementing or updating the AI generation logic:
- **Characters**: Extract visual assets from prompts/images and map them to a universal 2D physics rig.
- **Weapons**: Pre-match queue where users type concepts and set spawn timers. The AI generates a 2D sprite via API, which then drops into the arena. Equipping alters mass, hitboxes, or damage.
- **Arenas**: AI generates a custom 2D image for the background layer based on player prompts. 

## Reference Material
- **[Game Design Document (GDD)](references/gdd.md)**: The single source of truth for the game's design, mechanics, and technical specifications.
