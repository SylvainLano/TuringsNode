# Turing's Node

**[Play Turing's Node](https://sylvainlano.github.io/TuringsNode/)**

Turing's Node is a mathematical puzzle game. Every button changes the score in its own way, and turns green or red depending on the score. Nobody tells you the rules: you work them out by clicking.

## How to play

- **The score**, at the top, is not a target. It only decides the color of each button.
- **Each button** has a name and a value from 1 to 9. A click changes the score according to the button and its current value, then moves the value on to the next one (after 9 comes 1).
- **A button turns green** when the score meets its condition, and red when it does not. A ✓ or ✕ symbol repeats the color, so the game can be played without telling red from green.
- **Some buttons run out** in later worlds. Dots in their corner count the clicks they have left (● left, ○ used), squares the clicks allowed in a row (■ left, □ used), which come back as soon as you click another button.
- **Turn every button green** to complete the level. The fewer clicks you need, the better the medal: Bronze, Silver, Gold, and Platinum for the shortest solution.

Made a wrong move? Undo it or restart the level from the controls in the bottom right corner.

Really stuck? After a few restarts, you can beg the machine for a button's manual. It will cost you your best medal, which turns to chocolate until you win its level again. And the machine will make sure you remember it.

| Key | Action |
|---|---|
| `1` to `9` | Click the matching button |
| `Ctrl+Z` or `Backspace` | Undo the last click |

## The campaign

The campaign is split into worlds. The first ones are short and gentle, with simple buttons; the next ones grow longer, and harder. A world only opens once the previous one is fully complete. How many are there? The machine won't say.

Each level pays tribute to someone who made history, one way or another: famous blunders first, great minds later. Complete a level to hear their story, and what the machine thinks of you.

## Secrets

Not everything is on the map: hidden levels, rare colors, special backgrounds and plenty of achievements are waiting to be found. No spoilers here.

## Features

- French and English, picked from the browser language and changeable in the settings
- Progress, medals and achievements saved in the browser, along with the dossier the machine keeps on you
- Phone and desktop layouts, and a home screen icon when added to a phone
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
