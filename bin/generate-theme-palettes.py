# ╔══════════════════════════════════════╗
# ║  Ryan Wetzstein                      ║
# ║  Design                              ║
# ║  2026                                ║
# ╚══════════════════════════════════════╝

"""Nexis OKLCH palette generator, adapted from Nexis's generate-theme-palettes.py."""

import argparse
import json
import math
import re
from pathlib import Path

# ---------- OKLCH -> sRGB ----------
def _f(x):
    return 12.92 * x if x <= 0.0031308 else 1.055 * (x ** (1 / 2.4)) - 0.055

def oklch_to_rgb(L, C, h):
    hr = math.radians(h)
    a, b = C * math.cos(hr), C * math.sin(hr)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return r, g, bl

def in_gamut(rgb, eps=1e-4):
    return all(-eps <= c <= 1 + eps for c in rgb)

def hex_of(L, C, h):
    """Clip chroma until the colour fits sRGB, then emit #rrggbb."""
    lo, hi = 0.0, C
    if not in_gamut(oklch_to_rgb(L, C, h)):
        for _ in range(30):
            mid = (lo + hi) / 2
            if in_gamut(oklch_to_rgb(L, mid, h)):
                lo = mid
            else:
                hi = mid
        C = lo
    r, g, b = oklch_to_rgb(L, C, h)
    out = []
    for c in (r, g, b):
        v = _f(min(1.0, max(0.0, c)))
        out.append(round(v * 255))
    return "#%02x%02x%02x" % tuple(out)

# ---------- WCAG contrast ----------
def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def relum(hx):
    h = hx.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)

def contrast(a, b):
    la, lb = relum(a), relum(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)

# ---------- the ramp ----------
# One ramp shared by every theme in the set: only hue and chroma change.
# L values are OKLCH lightness; the resulting WCAG contrasts are asserted below.
DARK = {
    "background":  (0.180, 0.012, "base"),
    "sidebar":     (0.155, 0.012, "base"),
    "card":        (0.215, 0.013, "base"),
    "popover":     (0.215, 0.013, "base"),
    "secondary":   (0.262, 0.014, "base"),
    "muted":       (0.262, 0.014, "base"),
    "accent":      (0.288, 0.016, "base"),
    "foreground":  (0.928, 0.012, "base"),
    "mutedFg":     (0.700, 0.018, "base"),
    "primary":     (0.760, "acc",  "accent"),
    "destructive": (0.660, 0.170, 25.0),
}
LIGHT = {
    "background":  (0.980, 0.006, "base"),
    "sidebar":     (0.958, 0.007, "base"),
    "card":        (1.000, 0.000, "base"),
    "popover":     (1.000, 0.000, "base"),
    "secondary":   (0.936, 0.011, "base"),
    "muted":       (0.936, 0.011, "base"),
    "accent":      (0.922, 0.014, "base"),
    "foreground":  (0.268, 0.020, "base"),
    "mutedFg":     (0.512, 0.020, "base"),
    "primary":     (0.520, "acc",  "accent"),
    "destructive": (0.505, 0.190, 27.0),
}

# ANSI slot hues (deg) — shifted per theme by `ansiShift`.
ANSI_HUES = [None, 27.0, 145.0, 85.0, 255.0, 320.0, 195.0, None]

# ANSI lightness ramp, shared across the set.
ANSI_DARK = {"norm": 0.705, "bright": 0.820, "black": 0.265,
             "brightBlack": 0.470, "white": 0.855, "brightWhite": 0.960}
ANSI_LIGHT = {"norm": 0.560, "bright": 0.485, "black": 0.300,
              "brightBlack": 0.500, "white": 0.552, "brightWhite": 0.290}

def build_ansi(dark, base_h, base_c_mul, ansi_shift, ansi_c):
    """The 16 ANSI slots. Shared by the generated themes and by the base
    palette in globals.css, so the default theme's terminal sits on the same
    ramp as the rest of the set rather than on stock library colours."""
    a = ANSI_DARK if dark else ANSI_LIGHT
    ansi = []
    for i in range(16):
        bright = i >= 8
        slot = i % 8
        if slot == 0:
            ansi.append(hex_of(a["brightBlack"] if bright else a["black"],
                               0.016 * base_c_mul, base_h))
        elif slot == 7:
            ansi.append(hex_of(a["brightWhite"] if bright else a["white"],
                               0.014 * base_c_mul, base_h))
        else:
            h = ANSI_HUES[slot] + ansi_shift
            L = a["bright"] if bright else a["norm"]
            C = ansi_c * (1.14 if bright else 1.0)
            ansi.append(hex_of(L, C, h))
    return ansi


def build_variant(dark, base_h, base_c_mul, acc_h, acc_c, ansi_shift, ansi_c):
    ramp = DARK if dark else LIGHT
    def col(key):
        L, C, H = ramp[key]
        h = base_h if H == "base" else (acc_h if H == "accent" else H)
        c = acc_c if C == "acc" else (C * base_c_mul if H == "base" else C)
        return hex_of(L, c, h)

    bg, fg = col("background"), col("foreground")
    prim = col("primary")
    colors = {
        "background": bg,
        "foreground": fg,
        "card": col("card"), "cardForeground": fg,
        "popover": col("popover"), "popoverForeground": fg,
        "primary": prim,
        "primaryForeground": hex_of(0.180 if dark else 0.995, 0.010 * base_c_mul, base_h),
        "secondary": col("secondary"), "secondaryForeground": fg,
        "muted": col("muted"), "mutedForeground": col("mutedFg"),
        "accent": col("accent"), "accentForeground": fg,
        "destructive": col("destructive"),
        "border": rgba(fg, 0.10 if dark else 0.14),
        "input": rgba(fg, 0.14 if dark else 0.18),
        "ring": prim,
        "sidebar": col("sidebar"), "sidebarForeground": fg,
        "sidebarPrimary": prim,
        "sidebarPrimaryForeground": hex_of(0.180 if dark else 0.995, 0.010 * base_c_mul, base_h),
        "sidebarAccent": col("accent"), "sidebarAccentForeground": fg,
        "sidebarBorder": rgba(fg, 0.10 if dark else 0.14),
        "sidebarRing": prim,
        "radius": "0.5rem",
    }

    ansi = build_ansi(dark, base_h, base_c_mul, ansi_shift, ansi_c)
    terminal = {
        "cursor": prim,
        "cursorAccent": bg,
        "selection": rgba(prim, 0.26 if dark else 0.20),
        "ansi": ansi,
    }
    return colors, terminal


def rgba(hx, alpha):
    h = hx.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return f"rgba({r},{g},{b},{alpha:.2f})"


# ---------- emit + verify ----------
def check(label, got, floor, failures):
    if got < floor:
        failures.append(f"{label}: {got:.2f} < {floor}")


def generate(spec):
    failures = []
    tid, name, bh, bcm, ah, ac, ash, anc, editor = spec
    variants = {}
    for mode, dark in (("dark", True), ("light", False)):
        colors, terminal = build_variant(dark, bh, bcm, ah, ac, ash, anc)
        variants[mode] = {"colors": colors, "terminal": terminal}
        bg, fg = colors["background"], colors["foreground"]
        p = f"{tid}/{mode}"
        check(f"{p} foreground", contrast(fg, bg), 11.0, failures)
        check(f"{p} mutedForeground", contrast(colors["mutedForeground"], bg), 4.5, failures)
        check(f"{p} primary", contrast(colors["primary"], bg), 4.5, failures)
        check(f"{p} primaryFg-on-primary",
              contrast(colors["primaryForeground"], colors["primary"]), 4.5, failures)
        check(f"{p} destructive", contrast(colors["destructive"], bg), 4.0, failures)
        check(f"{p} fg-on-card", contrast(fg, colors["card"]), 9.0, failures)
        check(f"{p} fg-on-sidebar", contrast(fg, colors["sidebar"]), 10.0, failures)
        check(f"{p} fg-on-muted", contrast(fg, colors["muted"]), 7.0, failures)
        a = terminal["ansi"]
        for i in list(range(1, 7)) + list(range(9, 15)):
            check(f"{p} ansi[{i}]", contrast(a[i], bg), 4.0, failures)
        check(f"{p} ansi[7]", contrast(a[7], bg), 4.5, failures)
        check(f"{p} ansi[15]", contrast(a[15], bg), 7.0, failures)
        check(f"{p} ansi[8] (dim/comment)", contrast(a[8], bg), 2.6, failures)
    if failures:
        raise ValueError("Contrast floors failed:\n" + "\n".join(failures))
    return {"id": tid, "name": name, "variants": variants,
            "editorTheme": {"dark": editor[0], "light": editor[1]}}


def main():
    parser = argparse.ArgumentParser(prog="nexis-design theme new")
    parser.add_argument("id", help="lowercase theme identifier")
    parser.add_argument("--name", help="display name; defaults to a title-cased identifier")
    parser.add_argument("--hue", required=True, type=float, help="accent hue in degrees")
    parser.add_argument("--base-hue", type=float, help="surface hue; defaults to the accent hue")
    parser.add_argument("--chroma", type=float, default=0.15, help="accent chroma, default 0.15")
    parser.add_argument("--out", type=Path, help="new TypeScript file; defaults to <id>.ts")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", args.id):
        parser.error("ID must contain lowercase letters, digits and single hyphens")
    base_hue = args.hue if args.base_hue is None else args.base_hue
    if not all(0 <= hue < 360 for hue in (args.hue, base_hue)):
        parser.error("hues must be between 0 (inclusive) and 360 (exclusive)")
    if not 0 <= args.chroma <= 0.4:
        parser.error("chroma must be between 0 and 0.4")
    name = args.name or args.id.replace("-", " ").title()
    spec = (args.id, name, base_hue, 1.0, args.hue, args.chroma, 0.0, 0.14,
            ("github-dark", "github-light"))
    target = args.out or Path(args.id + ".ts")
    try:
        result = generate(spec)
        body = ('import type { Theme } from "@nexis/design/theme";\n\n'
                f'export default {json.dumps(result, ensure_ascii=False, indent=2)} satisfies Theme;\n')
        with target.open("x", encoding="utf-8", newline="\n") as file:
            file.write(body)
    except (ValueError, OSError) as error:
        parser.exit(1, f"{error}\n")
    print(target)


if __name__ == "__main__":
    main()
