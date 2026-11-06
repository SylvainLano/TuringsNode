import { ButtonName, applyButtonAction, isButtonConditionMet, nextButtonValue } from './buttons';
import { Level, ScoreBounds, applyBouncingBoundaries } from './level';

export interface ButtonState {
  name: ButtonName;
  value: number;
  totalClickCount: number;
  consecutiveClickCount: number;
  totalClickLimit: number | null;
  consecutiveClickLimit: number | null;
}

export interface BoardState {
  score: number;
  buttons: ButtonState[];
}

export function createBoard(level: Level): BoardState {
  return {
    score: level.startScore,
    buttons: level.buttons.map(config => ({
      name: config.name,
      value: config.initialValue,
      totalClickCount: 0,
      consecutiveClickCount: 0,
      totalClickLimit: config.totalClickLimit ?? null,
      consecutiveClickLimit: config.consecutiveClickLimit ?? null
    }))
  };
}

/** Un bouton est désactivé quand il a atteint sa limite de clics (totale ou consécutive) */
export function isButtonDisabled(button: ButtonState): boolean {
  const totalLimitReached = !!button.totalClickLimit && button.totalClickCount >= button.totalClickLimit;
  const consecutiveLimitReached = !!button.consecutiveClickLimit && button.consecutiveClickCount >= button.consecutiveClickLimit;
  return totalLimitReached || consecutiveLimitReached;
}

/** Clics encore permis sur un bouton limité en nombre total de clics, ou null s'il n'a pas de limite */
export function remainingClicks(button: ButtonState): number | null {
  return button.totalClickLimit ? Math.max(0, button.totalClickLimit - button.totalClickCount) : null;
}

/** Clics encore permis d'affilée sur un bouton limité en clics consécutifs, ou null s'il n'a pas de limite */
export function remainingStreakClicks(button: ButtonState): number | null {
  return button.consecutiveClickLimit ? Math.max(0, button.consecutiveClickLimit - button.consecutiveClickCount) : null;
}

/**
 * Calcule le plateau obtenu après un clic sur le bouton `index`, sans modifier `board`.
 * L'action utilise la valeur du bouton avant le clic, puis la valeur passe à la suivante.
 * Ne vérifie pas si le bouton est désactivé : c'est à l'appelant de le faire.
 */
export function pressButton(board: BoardState, index: number, bounds: ScoreBounds): BoardState {
  const pressed = board.buttons[index];
  const rawScore = applyButtonAction(pressed.name, board.score, pressed.value);

  return {
    score: applyBouncingBoundaries(rawScore, bounds),
    buttons: board.buttons.map((button, i) => i === index
      ? {
          ...button,
          value: nextButtonValue(button.value),
          totalClickCount: button.totalClickCount + 1,
          consecutiveClickCount: button.consecutiveClickCount + 1
        }
      // Pour tous les autres boutons, la série de clics consécutifs est rompue
      : { ...button, consecutiveClickCount: 0 }
    )
  };
}

/** Gagné quand tous les boutons sont verts, ou, si le niveau a un objectif, quand le score l'atteint exactement */
export function isLevelComplete(board: BoardState, targetScore: number | null = null): boolean {
  if (targetScore !== null) return board.score === targetScore;
  return board.buttons.every(button => isButtonConditionMet(button.name, board.score, button.value));
}
