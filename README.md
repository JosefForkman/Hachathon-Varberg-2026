# S-Halland

An interactive atlas of Halland's protected areas. Track biodiversity,
climate resilience, and ecosystem health in one live view — combining
GeoJSON from Naturvårdsverket with real-time SMHI weather forecasts.

> Built for the [Icons Of](https://www.iconsof.se) hackathon · Varberg 2026 ·
> [LinkedIn](https://www.linkedin.com/company/iconsof)

## What it does

- **Interactive map** of every Naturreservat, Naturvårdsområde and
  marine protection area in Halland (Halland_skyddade_omraden).
- **Live Sustainability Score** per area: protection class × current
  climate stress (SMHI 24h forecast) × ecosystem proxies.
- **Weather Motion**: animated SMHI forecast in the header for
  Halmstad, updated every 30 minutes.
- **Free Value First** — full map and scores accessible immediately,
  no signup. Email is only requested for premium report export.

## Tech

- Vite + React 19
- react-leaflet + Leaflet · CARTO Dark Matter tiles
- lottie-react for weather motion
- SMHI Open Data — Meteorological Forecasts (PMP3g v2)
- Halland protected areas — Naturvårdsverket GeoJSON

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Data sources

- **Halland protected areas** · Naturvårdsverket
- **Weather forecast** · [SMHI Open Data](https://opendata.smhi.se/) (PMP3g v2)
- _Planned:_ SMHI MetObs (historical observations) and Strång (solar radiation)
  to enrich the climate-resilience term in the Sustainability Score.

## Built for the Icons Of hackathon

This project is a hackathon entry — useful first, promotional second.
Light co-branding only:

- Footer: "Built for the Icons Of hackathon" with link
- LinkedIn share text mentions Icons Of
- Preview metadata (`og:description`) mentions Icons Of

Visit [iconsof.se](https://www.iconsof.se) ·
[LinkedIn](https://www.linkedin.com/company/iconsof).