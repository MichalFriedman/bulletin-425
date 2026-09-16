# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single hand-authored static web edition of *Bulletin* issue 425 (Association of Former Residents of China / איגוד יוצאי סין, September 2026), rebuilt for mobile reading from a 48-page print PDF. There is no framework, no package manager, no build step, and no test suite — three source files plus binary assets.

## Commands

```bash
# Preview (fonts and the reader load fine over http://; file:// can block the OTFs)
python3 -m http.server 8000     # then open http://localhost:8000/bulletin-425.html

# Mirror source into the deploy directory — never copy the root PDF over out/Bulletin425.pdf
rsync -a --delete assets/ out/assets/
cp bulletin-425.html bulletin-mobile.css bulletin-mobile.js out/
cp bulletin-425.html out/index.html

# Check every referenced asset exists (77 unique refs across the HTML and CSS)
grep -oh "assets/[^\"')]*" bulletin-425.html bulletin-mobile.css | sort -u |
  while read -r f; do [ -e "$f" ] || echo "MISSING $f"; done
```

Verification is manual, in a browser: both languages at widths 320, 390, 430, 768, and 1440 — no horizontal overflow, all images load, and the contents drawer, language toggle, saved text size, deep links, original-page reader, and zoom all still work.

## Layout and deployment

- `bulletin-425.html`, `bulletin-mobile.css`, `bulletin-mobile.js`, `assets/` — the source edition. Opening the HTML directly works; the three files and `assets/` must travel together.
- `out/` — the published site, and the only thing hosting serves. It is a byte-identical mirror of the source files, plus `out/index.html` (a copy of `bulletin-425.html`) and `out/Bulletin425.pdf`. **Any source edit is only live once mirrored into `out/`.**

### Deployment

Live at **https://michalfriedman.github.io/bulletin-425/**, from the `site-publish` branch (the repo's default) via `.github/workflows/pages.yml`, which uploads `out/` as the Pages artifact. Pages cannot serve an arbitrary subdirectory from a branch, which is why this goes through Actions rather than a branch/folder source.

To publish a change: mirror source into `out/` (see Commands), commit, and `git push origin site-publish` — the workflow redeploys on every push to that branch, and `gh run watch` follows it. All asset paths in the HTML and CSS are relative, which is what lets the site work under the `/bulletin-425/` project-page subpath; keep it that way — a single root-absolute `/assets/…` would break every image.

`.openai/hosting.json` (`static.directory: out`) points at an earlier OpenAI static-hosting project (`appgprj_6aa27…`) that predates the Pages setup. It is inert here — driving it needs the ChatGPT/Codex surface it was published from.
- `out/Bulletin425.pdf` (~13 MB) is a size-reduced copy of the 27 MB source PDF at the repo root, deliberately regenerated rather than copied — the root PDF is untracked on `site-publish` (it *is* tracked on `main`, which is otherwise the same content).
- `bulletin-425.original.html` (gitignored, 6.5 MB) is the untouched HTML supplied at the start. Reference only; never edit or ship it.
- `tmp/` (gitignored) holds screenshots used while matching the print layout.

## Architecture

**Two stylesheets, in cascade order.** `bulletin-425.html` carries a large inline `<style>` block — the original cream/serif "paper" theme with its own light/dark tokens. `bulletin-mobile.css` loads after it and is an *override layer* that repaints the edition in the printed white/blue/red palette and matches print details (double blue rules, floated portraits, the red Chinese-course notice). Visual changes belong in `bulletin-mobile.css`; edits to the inline block are usually the wrong lever and can be silently overridden. Note that the refinement layer sets `main p{font-size:var(--base)!important}`, so per-paragraph font sizes will not take effect — change `--base` or the sizer scale instead.

**One document, two language editions.** `#sec-he` (`dir="rtl"`) and `#sec-en` (`dir="ltr"`) both live in the DOM; `bulletin-mobile.js` shows one and `hidden`s the other, flipping `<html lang>`/`dir`, the drawer contents, the sizer glyphs (א/A) and the skip link along with it. Article ids are namespaced `he-*` / `en-*`, and a `#he-…`/`#en-…` hash on load or `hashchange` selects the language.

**The JS generates structure from markup conventions**, so new content must follow them:
- Every `<article id data-page>` inside a language section is picked up automatically for the contents drawer and the top-of-section ToC; the entry number comes from `data-page` and the title from the first text node of its `<h2>`.
- Each article also gets a "View original page" button appended. The original-page number is `data-page` for Hebrew and `49 - data-page` for English (the two editions run from opposite ends of the printed issue); `data-source` overrides this where the mapping breaks — currently only `he-save` (the shared central event notice, page 29).
- The scholarship roll is authored as `.names p` with a leading `<span class="src">`, and rewritten at runtime into `.award-group` heading + `<ul class="awardees">` so recipients read one per line.

**Original-page reader.** A `<dialog>` over `assets/pages/page-01…48.webp` (the 25 printed sheets split into 48 single pages), with select/prev/next, arrow keys, a zoom toggle, and a PDF link. Page images are the only place page numbers are hard-coded (`1…48` in the loop).

**State.** `localStorage` keys `bul425-size-v2` (index into the 14/16/18/20/22 px scale) and `bul425-lang`. Both reads and writes are wrapped for private-mode failures.

**Fonts.** The eight licensed InDesign OTFs from the print issue live in `assets/fonts/` and are mapped by role at the bottom of `bulletin-mobile.css`: Almoni (`--sans`, UI and Hebrew body), Mekomi (`--serif`, English body and English headlines), Poeti (Hebrew headlines), Almoni Tzar (the Chinese-course headline).

## Content rules

- Wording differences between the Hebrew and English editions are in the source issue and are intentional — do not "fix" them by syncing the two sections.
- The scholarship roll is 65 recipients in each language; keep both lists complete and equal.
- The New Year greeting uses the original composed artwork (lettering and seal as one image), not re-set type.
