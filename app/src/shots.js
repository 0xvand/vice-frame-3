// Shot scenes: the fixed setups behind the entry's screenshots.
//
// The pictures in screenshots/ are captures of this very app, taken in a
// browser from the URLs listed in shots.json at the repository root. A
// `?shot=` parameter names the scene — `cover` shows a single finished
// cover full-frame, `editor` shows the studio with a cover loaded — and
// the remaining parameters describe that cover: its size, layout and
// grade, which bundled samples to load (by file stem under samples/),
// the lettering, the cast tags and the finishing switches. Once the
// scene is painted the page raises window.__shotReady, which is the
// capture tool's cue that the frame is final.
//
// Without a `shot` parameter none of this runs: a visitor simply gets
// the studio.

/** Parses a shot query into a scene object, or null outside shot mode. */
export function parseShot(query) {
  const kind = query.get('shot');
  if (!kind) return null;
  const list = (value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);
  return {
    kind,
    sizeId: query.get('size') ?? undefined,
    layoutId: query.get('layout') ?? undefined,
    gradeId: query.get('grade') ?? undefined,
    title: query.get('title') ?? undefined,
    subtitle: query.get('subtitle') ?? undefined,
    kicker: query.get('kicker') ?? undefined,
    titlePos: query.get('titlepos') ?? undefined,
    photos: list(query.get('photos') ?? query.get('photo')),
    roles: list(query.get('roles')),
    slice: query.get('slice') === '1',
    seal: query.get('seal') !== '0',
  };
}

/** Flags the painted scene as ready, two frames after the call. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    document.body.classList.add('shot-ready');
  }));
}
