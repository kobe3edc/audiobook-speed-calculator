# Audiobook Speed Calculator

Free browser tool: enter an audiobook’s length in whole hours and minutes, pick a playback speed from 1.00× to 3.00×, and see listening time and hours saved. Results are rounded to the nearest minute.

**Live site:** https://audiobookspeedcalculator.net/

- No signup
- No audio upload
- The listening-time math runs locally in your browser
- Hours are whole numbers from 0 to 200. Minutes are whole numbers from 0 to 59. Decimals are rejected instead of shortened.

## Use case

For listeners who speed up Audible, Libby, Spotify, Apple Books, Storytel, and similar apps, and want to know how long a book will actually take at their preferred speed.

Listening time = original length ÷ speed. Time saved = original length − listening time. Example: 10 hours at 1.5× is 6h 40m, which saves 3h 20m (about 33% less listening time). Playback at 1.5× is 50% faster than 1.0×.

## What’s in this repo

| File | Purpose |
|------|---------|
| `index.html` | Calculator, speed chart, and FAQ |
| `privacy.html` | Privacy notice |
| `about.html` | What the tool is |
| `contact.html` | Feedback via GitHub Issues |
| `calculator.js` | Duration checks and time math |
| `analytics-choice.js` | Optional Google Analytics load |
| `theme.js` / `site.css` | Shared styling |
| `robots.txt` | Allow all crawlers |
| `sitemap.xml` | Sitemap for Search Console |
| `favicon.svg` | Site icon |
| `vercel.json` | Clean URLs so `/privacy` serves `privacy.html` |
| `docs/before-adsense.md` | Operator checklist before any ad code. Not a public page and not in the sitemap. |

## Stack

Static HTML/CSS/JS on [Vercel](https://vercel.com/). Canonical host: `https://audiobookspeedcalculator.net/`.

Google Analytics measurement ID `G-X0RVS4D5VV` loads only after the visitor accepts it in this browser. Fonts still come from Google Fonts, and styles still use the Tailwind CDN. The site does not show ads. Read `docs/before-adsense.md` before adding any.

## Local preview

```bash
npx serve .
```

`/privacy`, `/about`, and `/contact` need a server that maps those paths to the HTML files. `vercel.json` does that on Vercel. Opening the HTML files directly will not.

## Tests

```bash
node --test test/calculator.test.js
```

## Feedback

Public issues: https://github.com/kobe3edc/audiobook-speed-calculator/issues

## License

Use freely for personal learning and demos.
