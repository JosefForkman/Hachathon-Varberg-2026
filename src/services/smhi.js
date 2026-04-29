// SMHI Open Data — Meteorological Forecasts (PMP3g v2)
// Free, no API key. Docs: https://opendata.smhi.se/apidocs/metfcst/index.html

const HALMSTAD = { lat: 56.6745, lon: 12.8578 };
const CACHE_KEY = "s-halland:weather-cache";
const CACHE_MS = 30 * 60 * 1000; // 30 minutes

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
    1: "Clear sky",
    2: "Nearly clear",
    3: "Variable clouds",
    4: "Half clear",
    5: "Cloudy",
    6: "Overcast",
    7: "Fog",
    8: "Light showers",
    9: "Rain showers",
    10: "Heavy showers",
    11: "Thunderstorm",
    12: "Light sleet",
    13: "Sleet",
    14: "Heavy sleet",
    15: "Light snow",
    16: "Snow",
    17: "Heavy snow",
    18: "Light rain",
    19: "Rain",
    20: "Heavy rain",
    21: "Thunder",
    22: "Light sleet",
    23: "Sleet",
    24: "Heavy sleet",
    25: "Light snow",
    26: "Snow",
    27: "Heavy snow",
};

export function symbolToLabel(code) {
    return SYMBOL_LABEL[code] || "Unknown";
}

function pickParam(params, name) {
    const p = params.find((x) => x.name === name);
    return p ? p.values[0] : null;
}

export async function fetchHallandForecast({
    lat = HALMSTAD.lat,
    lon = HALMSTAD.lon,
} = {}) {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const cached = JSON.parse(raw);
            if (cached.ts && Date.now() - cached.ts < CACHE_MS) {
                return cached.data;
            }
        }
    } catch {}

    const url = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SMHI fetch failed: ${res.status}`);
    const json = await res.json();

    const first = json.timeSeries?.[0];
    if (!first) throw new Error("SMHI response missing timeSeries");

    const params = first.parameters;
    const data = {
        temp: pickParam(params, "t"),
        symbol: pickParam(params, "Wsymb2"),
        precip: pickParam(params, "pmean"),
        wind: pickParam(params, "ws"),
        validTime: first.validTime,
    };

    try {
        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), data }),
        );
    } catch {}

    return data;
}
