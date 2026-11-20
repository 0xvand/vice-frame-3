# Vice Frame 3 — GTA-style cover studio

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/0xvand/vice-frame-3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/0xvand/vice-frame-3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Frame 3 recasts your own photographs as GTA-style game key art. Drop in a few pictures — your car, your street, your crew — pick one of seven slanted-panel collage layouts, grade the whole poster in one of nine sunset-and-neon colour treatments, and finish it with retro-chrome striped 3D lettering, cast-tag plaques, a hand-drawn sun-and-palm studio seal and a two-line billing block. The star panel's photograph bursts out of its frame, and the finished cover exports as a print-ready PNG in poster, square or wide sizes. Everything runs locally in the browser: no accounts, no uploads, no network calls.

## What it does

- **Your photos, or ours to start.** Upload images or drag them onto the page; four bundled sample artworks (a garage at golden hour, a pastel marina, a neon boulevard, a pier at sunset) are included so the studio works the moment it opens.
- **Seven slanted-panel layouts** — The Heist Seven (seven leaning panels), Hero Pop-Out (a wide star panel whose photo breaks its frame with a soft shadow), Boulevard Five, Diagonal Four, City Grid, Slice Six and the Twin Feature. Click any panel on the canvas to select it; drag to pan, scroll to zoom, or use the sliders.
- **Face-aware smart crop.** When a photo first lands in a panel, the studio studies a thumbnail of it — skin-tone likelihood, local detail and a portrait prior — and frames the panel on the subject it finds, so heads stop getting cropped off. One click re-frames; a manual focus pin is one drag away.
- **Nine colour grades** (Vice Sunset, Neon Nights, Golden Dusk, Palm Shade, Chrome Noon, Noir City, Magenta Heat, Aqua Dream, Amber Hour), each a filter pass over the photos plus a tint wash, a title glow, an accent colour and a vignette, finished with deterministic film grain.
- **Retro-chrome title.** Extruded, outlined display lettering filled with mirror-banded chrome and an accent pinstripe, with a letterspaced kicker above and subtitle below; the block sits at the top or stacks at the bottom of the cover.
- **Cast tags and billing.** Each panel can carry a smoked-glass cast plaque ("THE DRIVER", "THE INSIDER", …) that is guaranteed never to collide with the title or billing blocks, plus an editable two-line billing block in classic poster small print.
- **Slice mode** spreads one photograph across every panel of the layout, each panel revealing its own slice.
- **Exports** at Poster 1080×1350, Square 1080×1080 and Wide 1920×1080. The preview canvas *is* the export canvas, so what you see is exactly what downloads.

## Layout of the code

- `main.ts` — the packaging step: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored builder.
- `app/index.html`, `app/style.css` — the studio page and its dark cutting-room chrome, with local `@font-face` fonts.
- `app/src/main.js` — editor state, control cards, canvas gestures, shot scenes.
- `app/src/compose.js` — the cover engine: panels, pop-out, grades, grain, chrome title, seal, billing.
- `app/src/panels.js` — the seven layouts and the geometry helpers.
- `app/src/palette.js` — the nine grades.
- `app/src/smartcrop.js` — the face-aware focus study.
- `app/src/shots.js` — the `?shot=` scenes behind the screenshots.

Run it locally with `node serve.ts`, then open http://localhost:8080.
