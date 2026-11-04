// Dessin du favicon, sans dépendance à Angular (réutilisé pour générer les fichiers de public/)

// Mêmes couleurs que les boutons rouges du jeu
const BUTTON_COLOR = '#f56565';
const BUTTON_BORDER_COLOR = '#c53030';
const DIGIT_COLOR = 'rgba(255, 255, 255, 0.75)';
// Hauteur du chiffre par rapport au carré : plus grand que l'icône, il est coupé en haut et en bas comme sur les boutons
const DIGIT_HEIGHT_RATIO = 1.12;

export const digitFont = (size: number) => `italic 700 ${size}px Rubik, sans-serif`;

/**
 * Dessine l'icône : un bouton rouge du jeu avec son grand chiffre italique en filigrane.
 * @param rounded Faux pour l'icône iOS, dont le système arrondit lui-même les coins.
 */
export function drawDigitIcon(ctx: CanvasRenderingContext2D, digit: number, size: number, rounded = true): void {
  const radius = rounded ? size * 0.2 : 0;
  const border = Math.max(1, size / 16);
  const text = String(digit);

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fillStyle = BUTTON_COLOR;
  ctx.fill();
  ctx.clip();

  // Taille de police calculée pour que le chiffre lui-même dépasse légèrement du carré
  ctx.font = digitFont(100);
  const reference = ctx.measureText(text);
  const fontSize = 100 * DIGIT_HEIGHT_RATIO * size / (reference.actualBoundingBoxAscent + reference.actualBoundingBoxDescent);
  ctx.font = digitFont(fontSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText(text);
  ctx.fillStyle = DIGIT_COLOR;
  ctx.fillText(
    text,
    size / 2 + (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2,
    size / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
  );
  ctx.restore();

  if (rounded) {
    ctx.beginPath();
    ctx.roundRect(border / 2, border / 2, size - border, size - border, radius - border / 2);
    ctx.lineWidth = border;
    ctx.strokeStyle = BUTTON_BORDER_COLOR;
    ctx.stroke();
  }
}
