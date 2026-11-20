// The Vice Frame 3 cover engine.
//
// One state object describes a cover; this module paints it onto a 2D
// canvas at full export resolution. The editor's live preview and the
// exported PNG are this same painting at this same size, so the cover a
// user approves on screen is byte-for-byte the cover they download.
//
// Painting order follows a printed poster's logic: graded photographs
// clipped into leaning panels, the grade's wash and vignette over them,
// the paper-white dividers, the star's pop-out bursting over its frame
// line, a breath of film grain, and only then the lettering — cast tags,
// the retro-chrome title, the studio seal and the billing block.

import { panelsFor } from './panels.js';
import { gradeById } from './palette.js';
import { focusFor } from './smartcrop.js';

export const SIZES = {
  poster: { id: 'poster', name: 'Poster · 1080 × 1350', w: 1080, h: 1350 },
  square: { id: 'square', name: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  wide: { id: 'wide', name: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

export const DISPLAY_FONT = '"VF Condensed", "Noto Sans Display", sans-serif';
export const BLACK_FONT = '"VF Black", "Noto Sans Display", sans-serif';
export const SANS_FONT = '"VF Sans", "Noto Sans", sans-serif';

/** A layout's panels scaled from fractions into canvas pixels. */
function pixelPanels(layoutId, W, H) {
  return panelsFor(layoutId).map((panel) => ({
    star: panel.star,
    points: panel.corners.map(([x, y]) => [x * W, y * H]),
  }));
}

/** Traces a pixel panel's polygon as the current path. */
function tracePath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

/** Pixel-space bounding box of a pixel panel. */
function boxOf(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Cover-fit geometry: the scale at which a photograph covers a box
 * (times the user's zoom), and the top-left corner that places the
 * photograph's focus point at the same relative spot inside the box.
 * Pan nudges from there, in fractions of the box.
 */
function coverPlacement(img, box, focus, zoom, panX, panY) {
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * zoom;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return {
    x: box.x + (box.w - w) * focus.x + panX * box.w,
    y: box.y + (box.h - h) * focus.y + panY * box.h,
    w,
    h,
  };
}

/** The focus a panel frames on: an explicit pin, else the smart study. */
function framingFocus(panelState, img) {
  if (panelState.focus) return panelState.focus;
  if (panelState.smart) return focusFor(img);
  return { x: 0.5, y: 0.44 };
}

/** Paints one panel's photograph, clipped inside its polygon. */
function paintPanelPhoto(ctx, points, panelState, photos, grade, sliceMode, W, H) {
  const img = photos[panelState.photo];
  if (!img) return;
  ctx.save();
  tracePath(ctx, points);
  ctx.clip();
  ctx.filter = grade.filter;
  if (sliceMode) {
    // Slice mode: a single photograph spread across the whole canvas,
    // each panel revealing the slice of it that falls behind the panel.
    const whole = { x: 0, y: 0, w: W, h: H };
    const place = coverPlacement(img, whole, framingFocus(panelState, img), 1, 0, 0);
    ctx.drawImage(img, place.x, place.y, place.w, place.h);
  } else {
    const place = coverPlacement(
      img, boxOf(points), framingFocus(panelState, img),
      panelState.zoom, panelState.panX, panelState.panY,
    );
    ctx.drawImage(img, place.x, place.y, place.w, place.h);
  }
  ctx.filter = 'none';
  ctx.restore();
}

/** The grade's wash: its tint gradient over the whole collage. */
function paintWash(ctx, grade, W, H) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  for (const [stop, colour] of grade.wash) gradient.addColorStop(stop, colour);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

/** The grade's vignette: edges falling away to near-black. */
function paintVignette(ctx, grade, W, H) {
  const reach = Math.hypot(W, H) * 0.62;
  const gradient = ctx.createRadialGradient(W / 2, H * 0.46, reach * 0.42, W / 2, H * 0.52, reach);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(4, 2, 8, ${(grade.vignette * 0.62).toFixed(3)})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

/**
 * The pop-out. The star panel's photograph is painted a second time,
 * clipped to a spill shape that follows the panel's leaning right edge
 * and bulges past it into the neighbouring panel before tapering home a
 * little past halfway down. A soft shadow strokes the break line, so
 * the star reads as standing in front of the poster, not on it.
 */
function paintPopOut(ctx, points, panelState, photos, grade, W, H) {
  const img = photos[panelState.photo];
  if (!img) return;
  const box = boxOf(points);
  const topRight = points[1];
  const bottomRight = points[2];
  const spill = Math.min(W * 0.085, box.w * 0.24);
  const midFrac = 0.58;
  const midX = topRight[0] + (bottomRight[0] - topRight[0]) * midFrac;
  const midY = box.y + box.h * midFrac;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(topRight[0] - 2, topRight[1] - 2);
  ctx.lineTo(topRight[0] + spill, topRight[1] - 2);
  ctx.lineTo(midX, midY);
  ctx.lineTo(topRight[0] - 2, box.y + box.h * 0.30);
  ctx.closePath();
  ctx.clip();
  ctx.filter = grade.filter;
  const place = coverPlacement(
    img, box, framingFocus(panelState, img),
    panelState.zoom, panelState.panX, panelState.panY,
  );
  ctx.drawImage(img, place.x, place.y, place.w, place.h);
  ctx.filter = 'none';
  paintWash(ctx, grade, W, H);
  ctx.restore();
  // The shadow along the tear.
  ctx.save();
  ctx.strokeStyle = 'rgba(5, 2, 10, 0.45)';
  ctx.lineWidth = Math.max(6, W * 0.008);
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(5, 2, 10, 0.6)';
  ctx.shadowBlur = Math.max(8, W * 0.012);
  ctx.beginPath();
  ctx.moveTo(topRight[0] + spill, topRight[1] + 2);
  ctx.lineTo(midX, midY);
  ctx.stroke();
  ctx.restore();
}

let grainTile = null;

/**
 * A tile of film grain from a fixed-seed generator: the same tile every
 * time, so a cover renders identically on every machine and every run.
 */
function makeGrainTile() {
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const image = tctx.createImageData(140, 140);
  let seed = 20261120;
  const nextRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 96 + Math.floor(nextRandom() * 64);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  return tile;
}

/** Grain over the photographs, under the lettering. */
function paintGrain(ctx, amount, W, H) {
  if (amount <= 0) return;
  if (!grainTile) grainTile = makeGrainTile();
  ctx.save();
  ctx.globalAlpha = 0.04 + amount * 0.09;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Rounded-rectangle path helper, for the cast tag plaques. */
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * One cast tag: a smoked-glass plaque with an accent tick, centred on
 * its panel and hugging the panel's foot — but never dipping below
 * `floorY`, the line the caller reserves for the lettering at the
 * cover's foot (billing block, and the title block when it sits low).
 */
function paintCastTag(ctx, points, role, accent, W, H, floorY) {
  const box = boxOf(points);
  const fontSize = Math.max(13, H * 0.019);
  ctx.save();
  ctx.font = `700 ${fontSize}px ${SANS_FONT}`;
  try { ctx.letterSpacing = `${fontSize * 0.14}px`; } catch { /* canvas without letterSpacing */ }
  const label = role.toUpperCase();
  const textWidth = ctx.measureText(label).width;
  const padX = fontSize * 0.7;
  const w = textWidth + padX * 2 + fontSize * 0.5;
  const h = fontSize * 1.72;
  const centreX = box.x + box.w / 2;
  const x = Math.min(Math.max(centreX - w / 2, 8), W - w - 8);
  const y = Math.min(box.y + box.h - h - H * 0.016, floorY - h - H * 0.008);
  ctx.fillStyle = 'rgba(7, 5, 13, 0.80)';
  roundedRect(ctx, x, y, w, h, h * 0.24);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(x + fontSize * 0.28, y + h * 0.22, fontSize * 0.2, h * 0.56);
  ctx.fillStyle = '#f5f1e6';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + padX + fontSize * 0.42, y + h * 0.54);
  ctx.restore();
}

/**
 * The retro-chrome title. The lettering is stamped first as an extruded
 * navy depth, outlined hard, then filled with a mirror-banded chrome
 * gradient — bright at the midline, with one pinstripe of the accent
 * colour running through the band — the way airbrushed poster titles of
 * the eighties and nineties were painted. Drawn centred at (cx, top);
 * returns the vertical space it consumed.
 */
function paintChromeTitle(ctx, text, cx, top, maxWidth, baseSize, accent) {
  const label = text.trim().toUpperCase() || 'VICE FRAME';
  let size = baseSize;
  ctx.save();
  const applyFont = () => { ctx.font = `${size}px ${DISPLAY_FONT}`; };
  applyFont();
  while (ctx.measureText(label).width > maxWidth && size > 18) {
    size *= 0.94;
    applyFont();
  }
  const width = ctx.measureText(label).width;
  ctx.translate(cx, top);
  ctx.transform(1, 0, -0.055, 1, 0, 0);
  ctx.rotate(-0.018);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // The halo the grade throws behind the letters.
  const halo = ctx.createRadialGradient(0, size * 0.5, size * 0.2, 0, size * 0.5, width * 0.72);
  halo.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-width * 0.75, -size * 0.35, width * 1.5, size * 1.7);
  // Extrusion: repeated stamps stepping down and to the right.
  const steps = Math.max(3, Math.round(size * 0.055));
  ctx.shadowColor = 'rgba(3, 2, 8, 0.55)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetY = size * 0.03;
  ctx.fillStyle = '#131a36';
  for (let i = steps; i >= 1; i -= 1) {
    ctx.fillText(label, i * size * 0.016, i * size * 0.02);
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // The separating outline.
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.052;
  ctx.strokeStyle = '#0a0d1f';
  ctx.strokeText(label, 0, 0);
  // The chrome bands themselves, with the accent pinstripe at the waist.
  const chrome = ctx.createLinearGradient(0, 0, 0, size);
  chrome.addColorStop(0.0, '#fdfdff');
  chrome.addColorStop(0.16, '#c3cfec');
  chrome.addColorStop(0.3, '#67779f');
  chrome.addColorStop(0.44, '#e8f0ff');
  chrome.addColorStop(0.5, '#39466b');
  chrome.addColorStop(0.545, accent);
  chrome.addColorStop(0.6, '#8b9cc4');
  chrome.addColorStop(0.78, '#e6ecff');
  chrome.addColorStop(1.0, '#7c8cb2');
  ctx.fillStyle = chrome;
  ctx.fillText(label, 0, 0);
  // A hairline of light along the letters' top edge.
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 0, -size * 0.012);
  ctx.globalAlpha = 1;
  ctx.restore();
  return size * 1.04;
}

/** The subtitle: wide-tracked capitals in the accent colour. */
function paintSubtitle(ctx, text, cx, top, maxWidth, H, accent) {
  const label = text.trim().toUpperCase();
  if (!label) return 0;
  let size = H * 0.027;
  ctx.save();
  const applyFont = () => { ctx.font = `700 ${size}px ${SANS_FONT}`; };
  const applyTracking = () => { try { ctx.letterSpacing = `${size * 0.34}px`; } catch { /* no letterSpacing */ } };
  applyFont();
  applyTracking();
  while (ctx.measureText(label).width > maxWidth && size > 10) {
    size *= 0.94;
    applyFont();
    applyTracking();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = 'rgba(6, 4, 12, 0.85)';
  ctx.strokeText(label, cx, top);
  ctx.fillStyle = accent;
  ctx.fillText(label, cx, top);
  ctx.restore();
  return size * 1.5;
}

/** The kicker above the title: small, quiet, very wide tracking. */
function paintKicker(ctx, text, cx, top, maxWidth, H) {
  const label = text.trim().toUpperCase();
  if (!label) return 0;
  const size = H * 0.0165;
  ctx.save();
  ctx.font = `700 ${size}px ${SANS_FONT}`;
  try { ctx.letterSpacing = `${size * 0.52}px`; } catch { /* no letterSpacing */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(245, 241, 230, 0.88)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = size * 0.3;
  if (ctx.measureText(label).width <= maxWidth) ctx.fillText(label, cx, top);
  ctx.restore();
  return size * 2.6;
}

/**
 * The studio seal: an original sun-and-palm badge drawn entirely in
 * code — a ringed disc, a low sun over two wave strokes, palm fronds
 * overhead, and the studio's name lettered around the ring. It sits in
 * a corner of every cover the studio makes, and it can be switched off.
 */
function paintSeal(ctx, cx, cy, radius, accent) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 6, 14, 0.78)';
  ctx.fill();
  ctx.lineWidth = radius * 0.075;
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
  ctx.lineWidth = radius * 0.028;
  ctx.strokeStyle = 'rgba(245, 241, 230, 0.75)';
  ctx.stroke();
  // Sun: a half disc sitting on the waterline.
  ctx.beginPath();
  ctx.arc(0, radius * 0.16, radius * 0.3, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  // Two wave strokes under it.
  ctx.strokeStyle = 'rgba(245, 241, 230, 0.9)';
  ctx.lineWidth = radius * 0.045;
  ctx.lineCap = 'round';
  for (const [dy, half] of [[0.3, 0.34], [0.44, 0.26]]) {
    ctx.beginPath();
    ctx.moveTo(-radius * half, radius * dy);
    ctx.quadraticCurveTo(0, radius * (dy - 0.09), radius * half, radius * dy);
    ctx.stroke();
  }
  // Fronds fanning from a point above the sun, and the trunk.
  ctx.strokeStyle = accent;
  ctx.lineWidth = radius * 0.05;
  for (const angle of [-2.75, -2.25, -1.75, -1.25, -0.75]) {
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.1);
    ctx.quadraticCurveTo(
      Math.cos(angle) * radius * 0.3,
      -radius * 0.1 + Math.sin(angle) * radius * 0.3 - radius * 0.1,
      Math.cos(angle) * radius * 0.52,
      -radius * 0.1 + Math.sin(angle) * radius * 0.52 + radius * 0.1,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, radius * 0.28);
  ctx.quadraticCurveTo(radius * 0.05, radius * 0.02, 0, -radius * 0.1);
  ctx.stroke();
  // Ring lettering and the founding line.
  ctx.fillStyle = 'rgba(245, 241, 230, 0.92)';
  ctx.font = `700 ${radius * 0.185}px ${SANS_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ringText = 'VICE FRAME STUDIO';
  const ringRadius = radius * 0.9;
  const sweep = Math.PI * 0.92;
  for (let i = 0; i < ringText.length; i += 1) {
    const a = -Math.PI / 2 - sweep / 2 + (sweep * i) / Math.max(1, ringText.length - 1);
    ctx.save();
    ctx.translate(Math.cos(a) * ringRadius, Math.sin(a) * ringRadius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ringText[i], 0, 0);
    ctx.restore();
  }
  ctx.font = `700 ${radius * 0.2}px ${SANS_FONT}`;
  ctx.fillText('EST · 2026', 0, radius * 0.66);
  ctx.restore();
}

/** The billing block: at most two lines of small print at the foot. */
function paintBilling(ctx, text, cx, bottom, maxWidth, H) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 2);
  if (!lines.length) return;
  const size = Math.max(9, H * 0.0128);
  ctx.save();
  ctx.font = `400 ${size}px ${SANS_FONT}`;
  try { ctx.letterSpacing = `${size * 0.06}px`; } catch { /* no letterSpacing */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(238, 235, 226, 0.82)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = size * 0.35;
  lines.forEach((line, i) => {
    let out = line.toUpperCase();
    while (ctx.measureText(out).width > maxWidth && out.length > 8) out = out.slice(0, -4).trimEnd() + '…';
    ctx.fillText(out, cx, bottom - (lines.length - 1 - i) * size * 1.35);
  });
  ctx.restore();
}

/**
 * Paints the whole cover described by `state` onto `ctx` at W × H.
 * `state.photos` holds the loaded image elements and `state.panels` the
 * per-panel framing, in the layout's panel order.
 */
export function drawCover(ctx, W, H, state) {
  const grade = gradeById(state.gradeId);
  const panels = pixelPanels(state.layoutId, W, H);
  ctx.fillStyle = grade.base;
  ctx.fillRect(0, 0, W, H);

  // Photographs first, ordinary panels before the star panel so the
  // pop-out can spill across its neighbour.
  const order = panels.map((panel, i) => i).sort((a, b) => Number(panels[a].star) - Number(panels[b].star));
  for (const i of order) {
    paintPanelPhoto(ctx, panels[i].points, state.panels[i], state.photos, grade, state.slice, W, H);
  }
  paintWash(ctx, grade, W, H);
  paintVignette(ctx, grade, W, H);

  // Paper-white dividers between the panels.
  ctx.save();
  ctx.strokeStyle = '#f7f3e8';
  ctx.lineWidth = Math.max(5, W * 0.0068);
  ctx.lineJoin = 'round';
  for (const panel of panels) {
    tracePath(ctx, panel.points);
    ctx.stroke();
  }
  ctx.restore();

  // The star bursts its frame.
  const starIndex = panels.findIndex((panel) => panel.star);
  if (starIndex >= 0 && state.photos[state.panels[starIndex].photo]) {
    paintPopOut(ctx, panels[starIndex].points, state.panels[starIndex], state.photos, grade, W, H);
  }

  paintGrain(ctx, state.grain, W, H);

  // Lettering geometry, settled before the cast tags are placed: the
  // billing block owns a strip at the cover's foot when it is on, and a
  // low title stacks its whole block — kicker, title, subtitle — above
  // that strip. Tags in the last row must stop clear of both, so their
  // floor is whichever of the two reaches higher.
  const billingReserve = state.billing ? H * 0.045 : 0;
  const titleSize = H * 0.118 * state.titleScale;
  let tagFloor = state.billing ? H * 0.945 : H;
  if (state.titlePos === 'bottom') {
    const blockHeight = titleSize * 1.04 + H * 0.058 + H * 0.028;
    const blockTop = H - billingReserve - blockHeight - H * 0.018;
    tagFloor = Math.min(tagFloor, blockTop - H * 0.012);
  }

  // Cast tags at the feet of their panels.
  panels.forEach((panel, i) => {
    const role = state.panels[i].role;
    if (role && role.trim()) paintCastTag(ctx, panel.points, role, state.accent, W, H, tagFloor);
  });

  // The title block, at the head or stacked at the foot.
  if (state.titlePos === 'top') {
    let y = H * 0.038;
    y += paintKicker(ctx, state.kicker, W / 2, y, W * 0.9, H);
    const used = paintChromeTitle(ctx, state.title, W / 2, y, W * 0.9, H * 0.118 * state.titleScale, state.accent);
    paintSubtitle(ctx, state.subtitle, W / 2, y + used + H * 0.008, W * 0.86, H, state.accent);
  } else {
    const blockHeight = titleSize * 1.04 + H * 0.058 + H * 0.028;
    let y = H - billingReserve - blockHeight - H * 0.018;
    y += paintKicker(ctx, state.kicker, W / 2, y, W * 0.9, H);
    const used = paintChromeTitle(ctx, state.title, W / 2, y, W * 0.9, titleSize, state.accent);
    paintSubtitle(ctx, state.subtitle, W / 2, y + used + H * 0.008, W * 0.86, H, state.accent);
  }

  if (state.seal) {
    const radius = Math.min(W, H) * 0.052;
    paintSeal(ctx, W - radius - W * 0.022, radius + H * 0.022, radius, state.accent);
  }
  if (state.billing) paintBilling(ctx, state.billingText, W / 2, H * 0.982, W * 0.78, H);
}

/** Sizes `canvas` to the state's export size and paints the cover. */
export function renderCover(canvas, state) {
  const size = SIZES[state.sizeId] ?? SIZES.poster;
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), size.w, size.h, state);
  return canvas;
}
