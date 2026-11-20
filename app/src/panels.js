// Panel geometry for Vice Frame 3.
//
// A cover is a stack of horizontal bands. Every band has an upper rim
// and a lower rim, and a rim is allowed to tilt: its height is stated at
// the canvas's left edge and at its right edge, and straight-line
// interpolation fills in between. Within a band, slanted cuts split it
// into panels; a cut's x position where it meets the upper rim may
// differ from where it meets the lower rim, so every divider leans a
// little. Bands and cuts together tile the canvas with angled
// quadrilaterals — the leaning collage that makes a game cover look
// like a game cover.
//
// All coordinates are fractions of the canvas width and height, so the
// same layout describes a poster, a square and a wide banner alike.
//
// A panel is { corners: [[x, y], ...], star: boolean }. `star` marks the
// one panel whose photograph may burst out of its frame (the renderer
// draws that breakout); only the Hero Pop-Out layout has one.

/** The height of a tilted rim at horizontal fraction x. */
function rimHeight(rim, x) {
  return rim[0] + (rim[1] - rim[0]) * x;
}

/** Expands one band spec into its panel quadrilaterals. */
function bandPanels(band) {
  const stops = [{ top: 0, bottom: 0 }, ...band.cuts, { top: 1, bottom: 1 }];
  const panels = [];
  for (let i = 0; i + 1 < stops.length; i += 1) {
    const l = stops[i];
    const r = stops[i + 1];
    panels.push({
      star: false,
      corners: [
        [l.top, rimHeight(band.upper, l.top)],
        [r.top, rimHeight(band.upper, r.top)],
        [r.bottom, rimHeight(band.lower, r.bottom)],
        [l.bottom, rimHeight(band.lower, l.bottom)],
      ],
    });
  }
  return panels;
}

/** The Hero Pop-Out, assembled directly: its star panel ignores bands. */
function heroPanels() {
  return [
    {
      star: true,
      corners: [[0, 0.16], [0.60, 0.16], [0.55, 1], [0, 1]],
    },
    {
      star: false,
      corners: [[0.60, 0.16], [1, 0.16], [1, 0.575], [0.575, 0.575]],
    },
    {
      star: false,
      corners: [[0.575, 0.575], [1, 0.575], [1, 1], [0.55, 1]],
    },
  ];
}

/** Cast names dealt to fresh panels, in order. */
export const CAST_LIST = [
  'THE DRIVER',
  'THE INSIDER',
  'THE MUSCLE',
  'THE BRAIN',
  'THE FIXER',
  'THE WHEELMAN',
  'THE LOOKOUT',
  'THE GETAWAY',
];

/** One-tap role suggestions offered in the panel card. */
export const ROLE_IDEAS = [
  'THE DRIVER',
  'THE INSIDER',
  'THE MUSCLE',
  'THE BRAIN',
  'THE FIXER',
  'THE WHEELMAN',
  'THE LOOKOUT',
  'THE GETAWAY',
  'THE SNIPER',
  'THE SMUGGLER',
];

/**
 * The seven layouts. Bands run top to bottom; each band's `upper` and
 * `lower` are [leftHeight, rightHeight] fractions, and each cut is
 * { top, bottom } — the cut's x fraction at the band's upper and lower
 * rims. `custom: 'hero'` marks the one layout the band builder cannot
 * express, which is put together by hand above.
 */
export const LAYOUTS = [
  {
    id: 'heist7',
    name: 'Heist Seven',
    blurb: 'Seven leaning panels in three bands, the whole crew on one cover',
    bands: [
      { upper: [0.16, 0.13], lower: [0.42, 0.45], cuts: [{ top: 0.52, bottom: 0.47 }] },
      {
        upper: [0.42, 0.45], lower: [0.72, 0.70],
        cuts: [{ top: 0.31, bottom: 0.35 }, { top: 0.65, bottom: 0.62 }],
      },
      { upper: [0.72, 0.70], lower: [1, 1], cuts: [{ top: 0.44, bottom: 0.40 }] },
    ],
  },
  {
    id: 'hero',
    name: 'Hero Pop-Out',
    blurb: 'A wide star panel with a pop-out, two panels alongside',
    custom: 'hero',
    bands: [],
  },
  {
    id: 'boulevard5',
    name: 'Boulevard Five',
    blurb: 'Two panels up top over a three-panel strip',
    bands: [
      { upper: [0.17, 0.14], lower: [0.52, 0.55], cuts: [{ top: 0.47, bottom: 0.52 }] },
      {
        upper: [0.52, 0.55], lower: [1, 1],
        cuts: [{ top: 0.30, bottom: 0.34 }, { top: 0.63, bottom: 0.60 }],
      },
    ],
  },
  {
    id: 'diagonal4',
    name: 'Diagonal Four',
    blurb: 'Four bold panels, two over two',
    bands: [
      { upper: [0.16, 0.13], lower: [0.54, 0.58], cuts: [{ top: 0.55, bottom: 0.48 }] },
      { upper: [0.54, 0.58], lower: [1, 1], cuts: [{ top: 0.42, bottom: 0.50 }] },
    ],
  },
  {
    id: 'grid6',
    name: 'City Grid',
    blurb: 'Three over three, no divider standing straight',
    bands: [
      {
        upper: [0.17, 0.15], lower: [0.55, 0.53],
        cuts: [{ top: 0.34, bottom: 0.31 }, { top: 0.67, bottom: 0.69 }],
      },
      {
        upper: [0.55, 0.53], lower: [1, 1],
        cuts: [{ top: 0.31, bottom: 0.35 }, { top: 0.66, bottom: 0.63 }],
      },
    ],
  },
  {
    id: 'slice6',
    name: 'Slice Six',
    blurb: 'Six slices built for slice mode, one photo across all',
    bands: [
      {
        upper: [0.15, 0.18], lower: [0.56, 0.52],
        cuts: [{ top: 0.33, bottom: 0.30 }, { top: 0.66, bottom: 0.70 }],
      },
      {
        upper: [0.56, 0.52], lower: [1, 1],
        cuts: [{ top: 0.30, bottom: 0.34 }, { top: 0.64, bottom: 0.61 }],
      },
    ],
  },
  {
    id: 'twin2',
    name: 'Twin Feature',
    blurb: 'Two panels, one long diagonal between them',
    bands: [
      { upper: [0.16, 0.13], lower: [1, 1], cuts: [{ top: 0.58, bottom: 0.38 }] },
    ],
  },
];

/** The panel list for a layout id, freshly built on every call. */
export function panelsFor(layoutId) {
  const layout = LAYOUTS.find((item) => item.id === layoutId) ?? LAYOUTS[0];
  if (layout.custom === 'hero') return heroPanels();
  return layout.bands.flatMap(bandPanels);
}

/** A panel's axis-aligned bounding box, in canvas fractions. */
export function panelBounds(panel) {
  const xs = panel.corners.map(([x]) => x);
  const ys = panel.corners.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

/** Even–odd point-in-polygon test, for tap-to-select on the canvas. */
export function hitPanel(panel, x, y) {
  const pts = panel.corners;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const crosses = (yi > y) !== (yj > y);
    if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
