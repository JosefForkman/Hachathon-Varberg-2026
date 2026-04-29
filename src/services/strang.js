// SMHI Strång — Global Horizontal Irradiance (GHI), parameter 117 (W/m²).
// Docs: https://opendata.smhi.se/apidocs/strang/parameters.html
//
// We average hourly values across the most recent full day to get a stable
// daily-mean GHI. That smooths out cloud noise and reflects what a solar
// developer would care about for a yield estimate.
//
// CORS works directly from the browser in our testing, but we wrap everything
// in try/catch and fall back to a Halland climatological mean (~120 W/m²
// annual average) so the rest of the score still renders if the API blips.

const CACHE_PREFIX = "s-halland:strang:";
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 h
const FALLBACK_GHI = 120; // W/m² — Halland annual daily-mean

function dateStr(d) {
    return d.toISOString().slice(0, 10);
}

function getYesterdayRange() {
    const today = new Date();
    const end = new Date(today);
    end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 1);
    return { from: dateStr(start), to: dateStr(end) };
}

function readCache(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const c = JSON.parse(raw);
        if (Date.now() - c.ts < CACHE_MS) return c.data;
    } catch {
        /* ignore */
    }
    return null;
}

function writeCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch {
        /* ignore */
    }
}

// Round coords to ~1 km grid so cache keys collapse for nearby clicks.
function gridKey(lat, lon) {
    return `${CACHE_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;
}

/**
 * Fetch daily-mean Global Horizontal Irradiance for a coordinate.
 * Returns { ghi: W/m², source: 'smhi'|'fallback', samples: number }.
 */
export async function fetchSolarGhi(lat, lon) {
    const key = gridKey(lat, lon);
    const cached = readCache(key);
    if (cached) return cached;

    const { from, to } = getYesterdayRange();
    const url =
        `https://opendata-download-metanalys.smhi.se/api/category/strang1g/version/1` +
        `/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}` +
        `/parameter/117/data.json?from=${from}&to=${to}&interval=hourly`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Strång ${res.status}`);
        const json = await res.json();
        const values = (Array.isArray(json) ? json : [])
            .map((row) => row.value)
            .filter((v) => Number.isFinite(v));

        if (values.length === 0) throw new Error("Strång empty");

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const data = {
            ghi: mean,
            source: "smhi",
            samples: values.length,
            from,
            to,
        };
        writeCache(key, data);
        return data;
    } catch (err) {
        console.warn("[strang] fallback —", err.message);
        return { ghi: FALLBACK_GHI, source: "fallback", samples: 0 };
    }
}

// Convert daily-mean GHI (W/m²) to a 0–100 score.
// Halland realistic daily-mean range: ~50 W/m² (winter) to ~250 W/m² (summer).
// 200+ = excellent; 100 = average; 50 = poor.
export function ghiToScore(ghi) {
    if (!Number.isFinite(ghi)) return 50;
    const min = 30;
    const max = 250;
    const t = (ghi - min) / (max - min);
    return Math.max(0, Math.min(100, Math.round(t * 100)));
}