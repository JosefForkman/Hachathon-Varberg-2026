// SMHI Open Data — Meteorological Forecast for Halland (Halmstad).
// Endpoint: snow1g/version/1 (current SMHI public API — flat `data` schema)
//
// Returns { temp, symbol, precip, wind, validTime } so WeatherMotion.jsx
// keeps working with the same interface.

const HALMSTAD = { lat: 56.6745, lon: 12.8578 };
const CACHE_KEY = "s-halland:weather-cache";
const CACHE_MS = 30 * 60 * 1000; // 30 min

// Map SMHI Wsymb2 codes to Lottie animation keys (used by WeatherMotion).
export function symbolToLottie(code) {
    if (code === 1 || code === 2) return "clear";
    if (code === 3 || code === 4) return "partly-cloudy";
    if (code === 5 || code === 6) return "cloudy";
    if (code === 7) return "fog";
    if ([8, 9, 18, 19].includes(code)) return "rain";
    if ([10, 20].includes(code)) return "heavy-rain";
    if ([11, 21].includes(code)) return "thunder";
    if ([12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 26, 27].includes(code))
        return "snow";
    return "partly-cloudy";
}

const SYMBOL_LABEL = {
    1: "Clear sky", 2: "Nearly clear", 3: "Variable clouds", 4: "Half clear",
    5: "Cloudy", 6: "Overcast", 7: "Fog",
    8: "Light showers", 9: "Rain showers", 10: "Heavy showers",
    11: "Thunderstorm", 12: "Light sleet", 13: "Sleet", 14: "Heavy sleet",
    15: "Light snow", 16: "Snow", 17: "Heavy snow",
    18: "Light rain", 19: "Rain", 20: "Heavy rain", 21: "Thunder",
    22: "Light sleet", 23: "Sleet", 24: "Heavy sleet",
    25: "Light snow", 26: "Snow", 27: "Heavy snow",
};
export function symbolToLabel(code) {
    return SYMBOL_LABEL[code] || "Unknown";
}

// Derive a Wsymb2-equivalent code from the new-format flat fields.
// snow1g doesn't ship Wsymb2 directly so we compute it from cloud cover,
// precipitation, and thunderstorm probability.
function deriveWsymb2(d) {
    const thunder = Number(d.thunderstorm_probability) || 0;
    const precip = Number(
        d.precipitation_amount_mean ?? d.precipitation_amount_mean_deterministic ?? 0,
    );
    const frozen = Number(d.probability_of_frozen_precipitation) || 0;
    const cloud = Number(d.cloud_area_fraction) || 0; // 0–9 oktas

    if (thunder >= 30) return 11;                      // Thunderstorm
    if (precip >= 5) return frozen > 0.5 ? 17 : 20;    // Heavy
    if (precip >= 1) return frozen > 0.5 ? 16 : 19;    // Moderate
    if (precip > 0)  return frozen > 0.5 ? 15 : 18;    // Light
    if (cloud >= 7) return 6;                          // Overcast
    if (cloud >= 5) return 5;                          // Cloudy
    if (cloud >= 3) return 4;                          // Half clear
    if (cloud >= 1) return 3;                          // Variable
    return 1;                                          // Clear
}

export async function fetchHallandForecast({
    lat = HALMSTAD.lat,
    lon = HALMSTAD.lon,
} = {}) {
    // Cache check
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const cached = JSON.parse(raw);
            if (cached.ts && Date.now() - cached.ts < CACHE_MS) {
                return cached.data;
            }
        }
    } catch {
        /* ignore */
    }

    const url =
        `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1` +
        `/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SMHI ${res.status}`);
    const json = await res.json();

    const first = json.timeSeries?.[0];
    if (!first) throw new Error("SMHI response missing timeSeries");

    // New SMHI format: parameters live in `data` (flat object).
    // Old format had `parameters: [{ name, values: [n] }]`.
    const d = first.data || {};
    const oldParams = first.parameters;

    let temp, wind, precip, symbol;
    if (oldParams && Array.isArray(oldParams)) {
        // Backwards-compat path
        const pick = (n) => {
            const p = oldParams.find((x) => x.name === n);
            return p ? p.values[0] : null;
        };
        temp = pick("t");
        wind = pick("ws");
        precip = pick("pmean");
        symbol = pick("Wsymb2");
    } else {
        // New flat path
        temp = d.air_temperature;
        wind = d.wind_speed;
        precip = d.precipitation_amount_mean ?? d.precipitation_amount_mean_deterministic ?? 0;
        symbol = deriveWsymb2(d);
    }

    const data = {
        temp,
        symbol,
        precip,
        wind,
        validTime: first.time || first.validTime,
    };

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (err) {
        console.error("SMHI cache write failed:", err);
    }
    return data;
}