import { EXPLOSION_QUAKE, RUMBLE_QUAKE, quakeKeyframes } from './victory-quake';

// Tirage pseudo-aléatoire reproductible, pour des tests stables
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

const shiftOf = (frame: Keyframe) => {
  const [x, y] = String(frame['transform']).match(/-?\d+(\.\d+)?/g)!.map(Number);
  return Math.hypot(x, y);
};

describe('Victory quake', () => {
  it('spreads irregular shakes over the whole phase', () => {
    const frames = quakeKeyframes(RUMBLE_QUAKE, seededRandom(1));
    const offsets = frames.map(frame => frame.offset as number);
    expect(offsets[0]).toBe(0);
    expect(offsets[offsets.length - 1]).toBe(1);
    const gaps = offsets.slice(1).map((offset, i) => offset - offsets[i]);
    expect(gaps.every(gap => gap > 0)).toBe(true);
    expect(new Set(gaps.map(gap => gap.toFixed(3))).size).toBeGreaterThan(5);
  });

  it('shakes harder and harder', () => {
    const frames = quakeKeyframes(RUMBLE_QUAKE, seededRandom(2));
    const third = Math.floor(frames.length / 3);
    const average = (part: Keyframe[]) => part.reduce((sum, frame) => sum + shiftOf(frame), 0) / part.length;
    expect(average(frames.slice(-third))).toBeGreaterThan(3 * average(frames.slice(0, third)));
  });

  it('keeps shaking while the board grows and fades out', () => {
    const frames = quakeKeyframes(EXPLOSION_QUAKE, seededRandom(3));
    const last = frames[frames.length - 1];
    expect(shiftOf(last)).toBeGreaterThan(5);
    expect(last['opacity']).toBe(0);
    expect(String(last['transform'])).toContain('scale(1.600)');
  });
});
