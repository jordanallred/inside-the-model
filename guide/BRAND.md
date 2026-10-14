# Inside the Model

The visual identity is a technical field guide: readable pages, working figures,
and direct explanations. Preserve the name and the promise, “See exactly how LLMs
work.” Avoid adding promotional claims without evidence in the project.

## Type and surfaces

Source Serif 4, weight 500, is the editorial face for page titles and article
section headings. Inter is the face for prose, navigation, and instrument controls.
JetBrains Mono is for code and numeric measurements. The serif font is bundled in
`public/fonts/` with its SIL Open Font License; logo lettering is outlined and has
no dependency on installed fonts.

Shared colors and radii live in `src/styles/brand-tokens.css`. Paper and ink are the
reading palette; muted blue identifies links and selected controls. Dark mode uses
the matching night palette. `theme.css` applies these to site navigation, chapters,
notes, and controls. `home.css` maps its colors to the same tokens.

The original Sky, Teal, Violet, and Peach tokens remain available for computational
roles inside charts. Do not assign each marketing section a different chart color.
Warnings retain their semantic colors and icons; routine notes use neutral surfaces.

## Mark and lockups

The single-color mark shows three layers crossed by a trace. Use the supplied light
or dark SVG lockup, with its outlined wordmark. Mobile uses the two-line lockup.
Keep the mark's proportions and avoid gradients, glowing edges, and atmospheric
technology decoration. The favicon follows the system's light/dark color scheme.

The social card is a typeset cover using the same lettering, paper, ink, and mark.
It is not an architecture diagram.

## Rebuilding assets

Only asset development requires Python, Pillow, and fonttools. After installing
those packages, run `python tools/gen-brand.py` from `guide/`. It regenerates the
seven SVG assets and `public/social-card.png` using the bundled font. It does not
change site content. Then run `npm run build` and `npm run check` and inspect the
header at desktop and mobile widths in both themes.
