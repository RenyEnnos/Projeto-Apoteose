# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Projeto Apoteose** is a browser-based cultivation/immortal progression game inspired by Chinese cultivation novels. It's built entirely in vanilla JavaScript with ES6 modules and runs directly in the browser without any build process.

## Development Commands

### Running the Game
```bash
# Open in browser (no build step required)
open index.html
# OR serve locally to avoid CORS issues with modules
python -m http.server 8000
# Then visit http://localhost:8000
```

### Development Workflow
- No compilation or build process needed
- Direct browser development with manual refresh
- Use browser DevTools for debugging
- Game state persists in LocalStorage as `apoteose_save_v3`

## Architecture Overview

### Core Systems Architecture
The game follows a modular system-component pattern with clear separation of concerns:

1. **State Management** (`js/core/gameState.js`): Centralized state with controlled mutation via getters/setters
2. **Game Loop** (`js/core/gameLoop.js`): 1-second logic tick + 60fps rendering loop using requestAnimationFrame
3. **Rendering System** (`js/rendering/`): Grid-based efficient rendering with minimal DOM manipulation
4. **Game Systems** (`js/systems/`): Independent systems for combat, aperture, world generation, etc.
5. **UI Management** (`js/ui/`): Event delegation and component management

### Key Technical Patterns
- **ES6 Modules**: Clean imports/exports with explicit dependencies
- **Data-Driven Design**: Game content defined in `js/core/constants.js`
- **Event-Driven UI**: Centralized event handling in `js/ui/eventHandlers.js`
- **Model-View Separation**: Game logic separate from rendering concerns

### Game Systems Integration
- **Cultivation System**: 5-realm progression (Qi Refinement → Immortal Ascendant)
- **Aperture System**: Dimensional pocket with ecology simulation that affects player progression
- **Combat System**: Rune-based ability crafting with drag-and-drop mechanics
- **Faction System**: Dynamic NPC factions with relationships affecting world state
- **Quest System**: Procedurally generated based on faction goals and player actions

### State Management Patterns
- Use `getGameState()` and `updateGameState()` for all state access
- State mutations should go through the gameState module to maintain consistency
- Save/load system automatically handles state persistence
- Grid coordinates use `{x, y}` format consistently

### File Organization Guidelines
- **Core**: Fundamental game engine components (state, loop, constants)
- **Systems**: Independent game logic systems that can be developed separately
- **Rendering**: Pure rendering logic with no game state mutations
- **UI**: User interface components and event handling
- **Utils**: Shared utility functions

### Development Guidelines
- Follow existing ES6 module patterns for new files
- Use consistent naming: camelCase for variables/functions, PascalCase for classes
- Grid rendering uses CSS Grid with absolute positioning for entities
- Portuguese language for user-facing text
- Use CSS custom properties (variables) for theming
- Maintain separation between game logic (1s tick) and rendering (60fps)

### Testing & Quality
No automated testing framework is currently set up. Manual testing involves:
- Loading saves to test persistence
- Testing all UI interactions
- Verifying game systems work across realm progressions
- Checking responsive design across viewport sizes

### Browser Compatibility
Requires modern browser with ES6 module support. Target: Chrome 61+, Firefox 60+, Safari 10.1+.