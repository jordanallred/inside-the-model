"""Rebuild the outlined SVG lockups and the typographic social card.

Development-only dependencies: fonttools and Pillow. The site itself needs neither.
The bundled Source Serif 4 font is licensed under the SIL Open Font License.
"""
from pathlib import Path
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"
FONT_PATH = PUBLIC / "fonts/source-serif-4-medium.ttf"
FONT = TTFont(FONT_PATH)
GLYPHS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPM = FONT["head"].unitsPerEm

PAPER = "#F6F5F0"
INK = "#222724"
BLUE = "#3F4C9C"
NIGHT_INK = "#EEEEF0"
NIGHT_BLUE = "#B5BEF5"


def lettering(text, x, baseline, size, color):
    """Outline lettering so SVG images never depend on an installed font."""
    scale = size / UPM
    paths = []
    for character in text:
        name = CMAP[ord(character)]
        glyph = GLYPHS[name]
        pen = SVGPathPen(GLYPHS)
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        if pen.getCommands():
            paths.append(f'<path d="{pen.getCommands()}"/>')
        x += glyph.width * scale
    return f'<g fill="{color}">' + "".join(paths) + "</g>", x


def symbol(color):
    return f'''<g fill="none" stroke="{color}" stroke-width="4" stroke-linejoin="round">
<path d="M64 10 110 34 64 58 18 34Z"/>
<path d="M18 58 64 82 110 58M18 82 64 106 110 82"/>
<path d="M64 34V106" stroke-width="3"/>
</g><g fill="{color}"><circle cx="64" cy="34" r="5"/><circle cx="64" cy="70" r="5"/><circle cx="64" cy="106" r="5"/></g>'''


def svg(width, height, body, label):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{escape(label)}"><title>{escape(label)}</title>{body}</svg>\n'


for theme, color, accent in [("light", INK, BLUE), ("dark", NIGHT_INK, NIGHT_BLUE)]:
    wordmark, end = lettering("Inside the Model", 68, 42, 32, color)
    body = f'<g transform="translate(0 5) scale(.43)">{symbol(accent)}</g>' + wordmark
    (BRAND / f"logo-horizontal-{theme}.svg").write_text(svg(round(end + 8), 64, body, "Inside the Model"), encoding="utf-8")
    first, _ = lettering("Inside", 68, 28, 25, color)
    second, end = lettering("the Model", 68, 55, 25, color)
    body = f'<g transform="translate(0 5) scale(.43)">{symbol(accent)}</g>' + first + second
    (BRAND / f"logo-stacked-{theme}.svg").write_text(svg(round(end + 8), 64, body, "Inside the Model"), encoding="utf-8")

(BRAND / "symbol.svg").write_text(svg(128, 128, symbol(BLUE), "Inside the Model layered-model symbol"), encoding="utf-8")
favicon_body = f'<style>@media(prefers-color-scheme:dark){{.mark{{color:{NIGHT_BLUE}}}}}</style><g class="mark" color="{BLUE}">{symbol("currentColor")}</g>'
for target in [PUBLIC / "favicon.svg", BRAND / "favicon.svg"]:
    target.write_text(svg(128, 128, favicon_body, "Inside the Model"), encoding="utf-8")

# A typeset cover, rather than an illustrative transformer schematic.
SCALE = 2
image = Image.new("RGB", (1200 * SCALE, 630 * SCALE), PAPER)
draw = ImageDraw.Draw(image)


def line(points, color, width):
    draw.line([(x * SCALE, y * SCALE) for x, y in points], fill=color, width=width * SCALE)


def text(position, value, size, color):
    draw.text(tuple(v * SCALE for v in position), value,
              font=ImageFont.truetype(str(FONT_PATH), size * SCALE), fill=color)


text((68, 44), "Inside the Model", 34, INK)
line([(68, 112), (1132, 112)], "#D4D8CF", 1)
text((68, 148), "See exactly", 86, INK)
text((68, 247), "how LLMs work.", 86, INK)
text((70, 389), "An interactive guide to the calculations, code,", 30, "#575F59")
text((70, 431), "training, and inference behind language models.", 30, "#575F59")
line([(68, 535), (1132, 535)], "#D4D8CF", 1)
text((70, 553), "insidethemodel.app", 25, BLUE)
# The same layer-and-trace symbol used in the header, with no semantic chart colors.
origin_x, origin_y, mark_scale = 905, 190, 1.6
for points in [[(64, 10), (110, 34), (64, 58), (18, 34), (64, 10)],
               [(18, 58), (64, 82), (110, 58)],
               [(18, 82), (64, 106), (110, 82)], [(64, 34), (64, 106)]]:
    line([(origin_x + x * mark_scale, origin_y + y * mark_scale) for x, y in points], BLUE, 3)
for y in [34, 70, 106]:
    x, cy = (origin_x + 64 * mark_scale) * SCALE, (origin_y + y * mark_scale) * SCALE
    radius = 5 * SCALE
    draw.ellipse((x-radius, cy-radius, x+radius, cy+radius), fill=BLUE)

metadata = PngImagePlugin.PngInfo()
metadata.add_text("Origin", "Typeset from Source Serif 4 and the authored vector layer mark by tools/gen-brand.py; no generated illustration.")
image.resize((1200, 630), Image.Resampling.LANCZOS).save(PUBLIC / "social-card.png", pnginfo=metadata)
print("Built 7 SVG brand assets and social-card.png.")
