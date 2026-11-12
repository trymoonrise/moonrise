# Third-party notices

Moonrise Studio is a private commercial product. Source and downloads are
available under the [Moonrise Studio License](LICENSE), which requires credit to
Moonrise ([trymoonrise.com](https://trymoonrise.com)). The components below keep
their own licenses. This file is for third-party attribution only.

## Fonts (SIL Open Font License 1.1)

Self-hosted under `assets/fonts/` and declared in `css/fonts.css` (and Newsreader in
page CSS that needs it). Moonrise does **not** load fonts from Google Fonts,
Adobe Fonts, Bunny Fonts, or other third-party font CDNs, so those providers do
not receive visitor IP addresses from Moonrise font requests.

| Family | License |
|---|---|
| DM Sans | SIL Open Font License 1.1 |
| IBM Plex Mono | SIL Open Font License 1.1 |
| Syne | SIL Open Font License 1.1 |
| Sora | SIL Open Font License 1.1 |
| Fraunces | SIL Open Font License 1.1 |
| Newsreader | SIL Open Font License 1.1 |

OFL overview: https://openfontlicense.org

## MapLibre GL JS

Business Finder map UI loads MapLibre GL from jsDelivr (`maplibre-gl`).

- License: BSD-3-Clause
- https://github.com/maplibre/maplibre-gl-js

## Map tiles and geodata

Finder map styles and tiles may use OpenFreeMap / OpenStreetMap-derived data.

- OpenFreeMap: https://openfreemap.org
- OpenStreetMap data © OpenStreetMap contributors, ODbL
  https://www.openstreetmap.org/copyright

When maps are shown in the product UI, credit OpenStreetMap contributors as
required by the ODbL community guidelines.

## npm / server dependencies

Runtime packages in `package.json` and `worker/package.json` (for example
Express, Stripe, Supabase JS, web-push) remain under their respective npm
licenses. Install with `npm install` and inspect `node_modules/<pkg>/LICENSE`
for the authoritative text.

Notable services (not redistributed as source in this repo):

- Stripe, payments (https://stripe.com)
- Supabase, auth and data (https://supabase.com)
- Vercel, hosting (https://vercel.com)

## Reporting license issues

If you believe attribution is missing or incorrect, email
[trymoonrise@gmail.com](mailto:trymoonrise@gmail.com).
