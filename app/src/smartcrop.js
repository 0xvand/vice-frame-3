// Face-aware smart cropping for Vice Frame 3.
//
// Dropping a wide photograph into a tall panel and cropping dead centre
// is how heads get cut off. Instead, the first time a photograph is used
// this module studies it: the picture is shrunk to a thumbnail and every
// pixel is scored for how strongly it suggests a subject — warm skin-like
// tones count most (two tests, so light and deep skin both register),
// fine local detail counts next (eyes, hair, jewellery and edges all
// carry detail), and a soft prior pulls gently toward the upper middle
// of the frame, where a portrait's face usually sits. The focus point is
// the balance point of the highest-scoring tenth of the thumbnail, and
// the renderer frames each panel so that point stays in the picture.
//
// The study runs entirely on the user's own machine, on a 96-pixel
// thumbnail, and its result is cached per image element.

const focusCache = new WeakMap();

/** Skin likelihood of one pixel, 0 to 1. */
function skinLikelihood(r, g, b) {
  // The textbook RGB rule: red clearly in front, with a healthy gap
  // between the red and green channels.
  const textbook = r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15 && r - b < 135;
  // A chroma rule that survives shade and deeper skin: warm ordering
  // (red over green over blue) with a moderate red-blue spread.
  const warmOrder = r > g && g > b && r - b > 26 && r - b < 125 && r > 62;
  if (textbook || warmOrder) return 1;
  // Half credit for tones that are nearly there, so they still tug.
  if (r > g && g >= b && r - b > 15 && r > 72) return 0.4;
  return 0;
}

/**
 * Studies an image element and returns its focus point { x, y } with
 * both coordinates in 0..1 (x across, y down the photograph).
 */
export function studyFocus(img) {
  const thumbW = 96;
  const thumbH = Math.max(24, Math.round((thumbW * img.naturalHeight) / img.naturalWidth));
  const scratch = document.createElement('canvas');
  scratch.width = thumbW;
  scratch.height = thumbH;
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(img, 0, 0, thumbW, thumbH);
  let pixels;
  try {
    pixels = sctx.getImageData(0, 0, thumbW, thumbH).data;
  } catch {
    // A tainted canvas (should not happen for local files) — fall back
    // to the portrait photographer's default framing.
    return { x: 0.5, y: 0.4 };
  }
  const weight = new Float32Array(thumbW * thumbH);
  let highest = 0;
  for (let y = 0; y < thumbH; y += 1) {
    for (let x = 0; x < thumbW; x += 1) {
      const i = (y * thumbW + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      // Detail: brightness distance to the right-hand and lower
      // neighbours. Flat skies and walls score nothing here.
      let detail = 0;
      if (x + 1 < thumbW) detail += Math.abs(r - pixels[i + 4]) + Math.abs(g - pixels[i + 5]);
      if (y + 1 < thumbH) {
        const j = i + thumbW * 4;
        detail += Math.abs(r - pixels[j]) + Math.abs(b - pixels[j + 2]);
      }
      // The prior: a shallow hill centred a little above the middle.
      const dx = x / thumbW - 0.5;
      const dy = y / thumbH - 0.4;
      const prior = Math.exp(-(dx * dx + dy * dy) * 5.0);
      const score = skinLikelihood(r, g, b) * 2.3 + Math.min(detail / 150, 1) * 0.75 + prior * 0.35;
      weight[y * thumbW + x] = score;
      if (score > highest) highest = score;
    }
  }
  // Balance point of the strongest tenth of the frame.
  const cutoff = highest * 0.9;
  let accX = 0;
  let accY = 0;
  let accW = 0;
  for (let y = 0; y < thumbH; y += 1) {
    for (let x = 0; x < thumbW; x += 1) {
      const score = weight[y * thumbW + x];
      if (score >= cutoff) {
        const w = score - cutoff + 0.001;
        accX += (x / thumbW) * w;
        accY += (y / thumbH) * w;
        accW += w;
      }
    }
  }
  if (accW === 0) return { x: 0.5, y: 0.4 };
  return {
    x: Math.min(0.84, Math.max(0.16, accX / accW)),
    y: Math.min(0.84, Math.max(0.14, accY / accW)),
  };
}

/** The focus point for an image, studied once and then remembered. */
export function focusFor(img) {
  let focus = focusCache.get(img);
  if (!focus) {
    focus = studyFocus(img);
    focusCache.set(img, focus);
  }
  return focus;
}
