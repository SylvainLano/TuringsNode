# Turing's Node

**[Play Turing's Node](https://sylvainlano.github.io/TuringsNode/)**

Turing's Node is a mathematical puzzle game. Every button changes the score in its own way, and turns green or red depending on the score. Nobody tells you the rules: you work them out by clicking.

## How to play

- **The score**, at the top, is not a target. It only decides the color of each button.
- **Each button** has a name and a value from 1 to 9. A click changes the score according to the button and its current value, then moves the value on to the next one (after 9 comes 1).
- **A button turns green** when the score meets its condition, and red when it does not. A ✓ or ✕ symbol repeats the color, so the game can be played without telling red from green.
- **Turn every button green** to complete the level. The fewer clicks you need, the better the medal: Bronze, Silver, Gold, and Platinum for the shortest solution.

Made a wrong move? Undo it or restart the level from the controls in the bottom right corner.

| Key | Action |
|---|---|
| `1` to `9` | Click the matching button |
| `Ctrl+Z` or `Backspace` | Undo the last click |

## The campaign

30 levels in 9 chapters. The first chapter starts with two buttons. Each of the next seven brings in a new one and mixes it with the buttons you already know. The final chapter combines four buttons per level.

## Secrets

Some scores hide more than a green button: rare colors, special backgrounds and 18 achievements are waiting to be found. No spoilers here.

## Features

- French and English, picked from the browser language and changeable in the settings
- Progress, medals and achievements saved in the browser
- Phone and desktop layouts
- Day and night backgrounds that follow the time of day

## Development

Built with Angular 22, tested with Vitest, with animated backgrounds from tsParticles.

| Command | Purpose |
|---|---|
| `npm ci` | Install the dependencies |
| `npm start` | Run the game locally on http://localhost:4200 |
| `npm test` | Run the unit tests |
| `npm run build` | Build the game into `dist/TuringsNode` |
| `npm run ng -- deploy` | Build and publish the game to GitHub Pages |

The game rules (button actions, conditions, score bounds, medals) live in `src/app/core/engine`, as plain TypeScript with no Angular dependency. The levels are in `src/assets/levels.json`, and the French and English texts in `src/assets/i18n`.
