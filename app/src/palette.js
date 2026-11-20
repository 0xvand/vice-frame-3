// The nine colour grades of Vice Frame 3.
//
// Each grade works in two passes. Its `filter` is a CSS filter string the
// renderer applies to the canvas while it paints each panel's photograph,
// so the pictures themselves are re-graded. Its `wash` is a vertical
// gradient of tint stops laid over the finished collage, and its `glow`
// is the halo colour thrown behind the chrome title. `accent` is the
// colour the studio suggests for the subtitle, cast tags and seal while
// the grade is active; `base` fills any corner no photograph reaches;
// `vignette` (0 to 1) is how hard the edges fall to black at the end.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.42) contrast(1.08) brightness(1.03)',
    wash: [[0, 'rgba(58, 0, 88, 0.10)'], [0.52, 'rgba(255, 96, 60, 0.10)'], [1, 'rgba(150, 0, 108, 0.44)']],
    glow: 'rgba(255, 116, 66, 0.55)',
    accent: '#ffb03a',
    base: '#2b0e34',
    vignette: 0.44,
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.58) contrast(1.15) brightness(0.99) hue-rotate(-7deg)',
    wash: [[0, 'rgba(186, 0, 255, 0.15)'], [0.5, 'rgba(0, 0, 64, 0.05)'], [1, 'rgba(0, 196, 255, 0.30)']],
    glow: 'rgba(255, 0, 178, 0.50)',
    accent: '#3ae2ff',
    base: '#0a051e',
    vignette: 0.52,
  },
  {
    id: 'dusk',
    name: 'Golden Dusk',
    filter: 'sepia(0.26) saturate(1.30) contrast(1.07) brightness(1.02)',
    wash: [[0, 'rgba(28, 14, 62, 0.22)'], [0.58, 'rgba(255, 148, 42, 0.08)'], [1, 'rgba(118, 38, 0, 0.34)']],
    glow: 'rgba(255, 178, 60, 0.55)',
    accent: '#ffd76a',
    base: '#1d1131',
    vignette: 0.46,
  },
  {
    id: 'shade',
    name: 'Palm Shade',
    filter: 'saturate(1.20) contrast(1.14) brightness(0.95)',
    wash: [[0, 'rgba(0, 62, 72, 0.20)'], [0.55, 'rgba(0, 0, 0, 0)'], [1, 'rgba(255, 108, 42, 0.30)']],
    glow: 'rgba(255, 142, 68, 0.45)',
    accent: '#ffb03a',
    base: '#0c1f26',
    vignette: 0.50,
  },
  {
    id: 'chrome',
    name: 'Chrome Noon',
    filter: 'saturate(1.10) contrast(1.04) brightness(1.07)',
    wash: [[0, 'rgba(42, 122, 255, 0.10)'], [0.7, 'rgba(0, 0, 0, 0)'], [1, 'rgba(0, 32, 84, 0.18)']],
    glow: 'rgba(122, 192, 255, 0.45)',
    accent: '#bfe0ff',
    base: '#112440',
    vignette: 0.30,
  },
  {
    id: 'noir',
    name: 'Noir City',
    filter: 'saturate(0.30) contrast(1.30) brightness(0.91)',
    wash: [[0, 'rgba(0, 0, 0, 0.26)'], [0.5, 'rgba(0, 0, 0, 0)'], [1, 'rgba(0, 0, 0, 0.46)']],
    glow: 'rgba(198, 198, 220, 0.35)',
    accent: '#e9e9f4',
    base: '#09090d',
    vignette: 0.74,
  },
  {
    id: 'magenta',
    name: 'Magenta Heat',
    filter: 'saturate(1.64) contrast(1.09) hue-rotate(-13deg) brightness(1.02)',
    wash: [[0, 'rgba(255, 0, 126, 0.14)'], [0.55, 'rgba(82, 0, 62, 0.06)'], [1, 'rgba(255, 0, 92, 0.36)']],
    glow: 'rgba(255, 62, 162, 0.55)',
    accent: '#ff7ad9',
    base: '#2c0619',
    vignette: 0.45,
  },
  {
    id: 'aqua',
    name: 'Aqua Dream',
    filter: 'saturate(1.36) contrast(1.07) hue-rotate(11deg)',
    wash: [[0, 'rgba(0, 82, 92, 0.16)'], [0.6, 'rgba(0, 0, 0, 0)'], [1, 'rgba(0, 158, 158, 0.30)']],
    glow: 'rgba(0, 222, 198, 0.45)',
    accent: '#54ffd8',
    base: '#052128',
    vignette: 0.41,
  },
  {
    id: 'amber',
    name: 'Amber Hour',
    filter: 'sepia(0.38) saturate(1.26) contrast(1.06) brightness(1.05)',
    wash: [[0, 'rgba(122, 62, 0, 0.12)'], [0.5, 'rgba(255, 172, 62, 0.10)'], [1, 'rgba(92, 32, 0, 0.32)']],
    glow: 'rgba(255, 192, 82, 0.55)',
    accent: '#ffcf5e',
    base: '#251303',
    vignette: 0.47,
  },
];

/** The grade with this id, or the first grade when the id is unknown. */
export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}
