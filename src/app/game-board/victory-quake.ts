// Secousse de victoire : images clés tirées au hasard à chaque fois (Web Animations),
// pour un tremblement irrégulier, de plus en plus violent, comme un vrai séisme

export interface QuakeOptions {
  // Intensité au début et à la fin de la phase (1 = secousse maximale)
  intensity: [number, number];
  scale: [number, number];
  brightness: [number, number];
  opacity?: [number, number];
  blur?: [number, number];
  // Écart entre deux secousses, en fraction de la durée de la phase
  step: [number, number];
}

// Le plateau tremble pendant 2 s : à peine au début, puis de plus en plus fort ; il gonfle et s'illumine
export const RUMBLE_QUAKE: QuakeOptions = {
  intensity: [0.15, 1],
  scale: [1, 1.05],
  brightness: [1, 1.35],
  step: [0.015, 0.05]
};

// Puis il explose : la secousse redouble pendant qu'il grossit, se brouille et disparaît
export const EXPLOSION_QUAKE: QuakeOptions = {
  intensity: [1, 1.5],
  scale: [1.05, 1.6],
  brightness: [1.35, 2],
  opacity: [1, 0],
  blur: [0, 10],
  step: [0.04, 0.09]
};

// Amplitude à l'intensité 1 : surtout horizontale, comme un séisme
const MAX_SHIFT_X = 34; // px
const MAX_SHIFT_Y = 16; // px
const MAX_TILT = 4;     // degrés
const JOLT_CHANCE = 0.15;
const JOLT_FACTOR = 1.7;

const lerp = ([from, to]: [number, number], progress: number) => from + (to - from) * progress;

export function quakeKeyframes(options: QuakeOptions, random: () => number = Math.random): Keyframe[] {
  const frames: Keyframe[] = [];
  let direction = 1;
  const shake = (offset: number) => {
    // L'intensité accélère vers la fin, avec de temps en temps une secousse plus brutale
    const jolt = random() < JOLT_CHANCE ? JOLT_FACTOR : 1;
    const intensity = lerp(options.intensity, offset ** 1.5) * jolt;
    // Le plus souvent, le plateau repart dans l'autre sens
    direction = random() < 0.75 ? -direction : direction;
    const x = direction * intensity * MAX_SHIFT_X * (0.4 + 0.6 * random());
    const y = (random() * 2 - 1) * intensity * MAX_SHIFT_Y;
    const tilt = (random() * 2 - 1) * intensity * MAX_TILT;
    frames.push(keyframe(options, offset, x, y, tilt));
  };

  for (let offset = 0; offset < 1; offset += lerp(options.step, random())) {
    shake(offset);
  }
  shake(1);
  return frames;
}

function keyframe(options: QuakeOptions, offset: number, x: number, y: number, tilt: number): Keyframe {
  const filters = [`brightness(${lerp(options.brightness, offset).toFixed(2)})`];
  if (options.blur) filters.push(`blur(${lerp(options.blur, offset).toFixed(1)}px)`);
  return {
    offset,
    transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(${lerp(options.scale, offset).toFixed(3)})`,
    filter: filters.join(' '),
    ...(options.opacity && { opacity: lerp(options.opacity, offset) })
  };
}
