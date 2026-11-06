import { createBoard, isButtonDisabled, isLevelComplete, pressButton, remainingClicks, remainingStreakClicks } from './board';
import { Level, getScoreBounds } from './level';

const makeLevel = (startScore: number, buttons: Level['buttons'], minScore: number | null = 12): Level => ({
  levelNumber: 1,
  world: 1,
  name: 'tester',
  startScore,
  minScore,
  maxScore: null,
  minSteps: 1,
  goldSteps: 2,
  silverSteps: 3,
  bronzeSteps: 4,
  buttons
});

const LEVEL = makeLevel(20, [
  { name: 'Primer', initialValue: 1 },
  { name: 'Split', initialValue: 2 },
  { name: 'Boost', initialValue: 3 }
]);

describe('Engine board', () => {
  const bounds = getScoreBounds(LEVEL);

  it('createBoard starts from the level configuration', () => {
    const board = createBoard(LEVEL);
    expect(board.score).toBe(20);
    expect(board.buttons.map(b => [b.name, b.value])).toEqual([['Primer', 1], ['Split', 2], ['Boost', 3]]);
    expect(board.buttons.every(b => b.totalClickCount === 0 && b.consecutiveClickCount === 0)).toBe(true);
  });

  it('pressButton uses the value before the click, then increments it', () => {
    const board = pressButton(createBoard(LEVEL), 1, bounds); // Split 2
    expect(board.score).toBe(14); // 20 / 2 = 10, qui rebondit sur la borne basse 12
    expect(board.buttons[1].value).toBe(3);
  });

  it('pressButton updates click counters and does not mutate the given board', () => {
    const start = createBoard(LEVEL);
    const afterTwoClicks = pressButton(pressButton(start, 0, bounds), 0, bounds);
    const afterSwitch = pressButton(afterTwoClicks, 2, bounds);

    expect(start.score).toBe(20);
    expect(start.buttons[0].totalClickCount).toBe(0);
    expect(afterTwoClicks.buttons[0].consecutiveClickCount).toBe(2);
    expect(afterSwitch.buttons[0].totalClickCount).toBe(2);
    expect(afterSwitch.buttons[0].consecutiveClickCount).toBe(0);
    expect(afterSwitch.buttons[2].consecutiveClickCount).toBe(1);
  });

  it('isLevelComplete requires every button to be green', () => {
    // Le score 11 a pour racine numérique 2 : Digit passe au vert dès que sa valeur vaut 2
    const level = makeLevel(11, [{ name: 'Digit', initialValue: 1 }], 10);
    const start = createBoard(level);
    expect(isLevelComplete(start)).toBe(false);
    expect(isLevelComplete(pressButton(start, 0, getScoreBounds(level)))).toBe(true);
  });

  it('isLevelComplete only checks the score when the level has a target', () => {
    const level = makeLevel(11, [{ name: 'Digit', initialValue: 2 }], 10);
    const start = createBoard(level); // Digit 2 est déjà vert sur 11
    expect(isLevelComplete(start, 22)).toBe(false);
    expect(isLevelComplete(pressButton(start, 0, getScoreBounds(level)), 22)).toBe(true); // 11 × 2
  });

  it('isButtonDisabled respects total and consecutive click limits', () => {
    const button = createBoard(LEVEL).buttons[0];
    expect(isButtonDisabled({ ...button, totalClickCount: 5 })).toBe(false);
    expect(isButtonDisabled({ ...button, totalClickLimit: 3, totalClickCount: 3 })).toBe(true);
    expect(isButtonDisabled({ ...button, consecutiveClickLimit: 2, consecutiveClickCount: 1 })).toBe(false);
    expect(isButtonDisabled({ ...button, consecutiveClickLimit: 2, consecutiveClickCount: 2 })).toBe(true);
    expect(isButtonDisabled({ ...button, totalClickLimit: 0, totalClickCount: 9 })).toBe(false);
  });

  it('reads click limits from the level, and counts the clicks left', () => {
    const level = makeLevel(20, [{ name: 'Plus', initialValue: 1, totalClickLimit: 2 }, { name: 'Minus', initialValue: 1 }]);
    const start = createBoard(level);
    expect(start.buttons.map(remainingClicks)).toEqual([2, null]);

    const afterTwoClicks = pressButton(pressButton(start, 0, bounds), 0, bounds);
    expect(remainingClicks(afterTwoClicks.buttons[0])).toBe(0);
    expect(isButtonDisabled(afterTwoClicks.buttons[0])).toBe(true);
  });

  it('counts the clicks left in a row, until another button is pressed', () => {
    const level = makeLevel(20, [{ name: 'Plus', initialValue: 1, consecutiveClickLimit: 2 }, { name: 'Minus', initialValue: 1 }]);
    const start = createBoard(level);
    expect(start.buttons.map(remainingStreakClicks)).toEqual([2, null]);

    const afterTwoClicks = pressButton(pressButton(start, 0, bounds), 0, bounds);
    expect([remainingStreakClicks(afterTwoClicks.buttons[0]), isButtonDisabled(afterTwoClicks.buttons[0])]).toEqual([0, true]);

    const afterSwitch = pressButton(afterTwoClicks, 1, bounds);
    expect([remainingStreakClicks(afterSwitch.buttons[0]), isButtonDisabled(afterSwitch.buttons[0])]).toEqual([2, false]);
  });
});
