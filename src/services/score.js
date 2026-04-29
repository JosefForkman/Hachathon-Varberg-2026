// Sustainability Score — combines static protection class with live climate stress.

const PROTECTION_WEIGHTS = {
    "nationalpark": 1.0,
    "naturreservat": 0.85,
    "natura 2000": 0.7,
    "naturvardsomrade": 0.6,
    "default": 0.65,
};

function normalizeType(raw) {
    if (!raw) return "default";
    const t = String(raw).toLowerCase();
    if (t.includes("national")) return "nationalpark";
    if (t.includes("reservat")) return "naturreservat";
    if (t.includes("natura")) return "natura 2000";
    if (t.includes("vard")) return "naturvardsomrade";
    return "default";
}

export function classifyType(raw) {
    const key = normalizeType(raw);
    if (key === "nationalpark")
        return { key, label: "National park", cssMod: "park" };
    if (key === "naturreservat")
        return { key, label: "Reserve", cssMod: "reserve" };
    if (key === "natura 2000")
        return { key, label: "Natura 2000", cssMod: "reserve" };
    if (key === "naturvardsomrade")
        return { key, label: "Conservation", cssMod: "other" };
    return { key, label: "Reserve", cssMod: "reserve" };
}

function hash01(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return (h % 1000) / 1000;
}

export function computeScore(area, weather) {
    const typeKey = normalizeType(area.type);
    const pw = PROTECTION_WEIGHTS[typeKey] || PROTECTION_WEIGHTS.default;

    const bioVar = hash01((area.name || "") + "bio") * 0.2 - 0.1;
    const biodiversity = clamp((pw + bioVar) * 100, 40, 99);

    let climate = 1;
    if (weather) {
        if (weather.temp != null && weather.temp > 22) climate -= 0.18;
        if (weather.precip === 0) climate -= 0.12;
        if (weather.precip != null && weather.precip > 5) climate -= 0.18;
        if (weather.wind != null && weather.wind > 10) climate -= 0.1;
        if (weather.symbol === 11 || weather.symbol === 21) climate -= 0.1;
    }
    climate = clamp(climate * 100, 25, 95);

    const sizeKm2 = area.area || 5;
    const sizeFactor = Math.min(1, Math.log10(sizeKm2 + 1) / 3);
    const ecoVar = hash01((area.name || "") + "eco") * 0.2 - 0.1;
    const ecosystem = clamp((0.5 + 0.5 * sizeFactor + ecoVar) * 100, 35, 99);

    const total = Math.round(
        0.4 * biodiversity + 0.35 * climate + 0.25 * ecosystem,
    );

    return {
        total,
        biodiversity: Math.round(biodiversity),
        climate: Math.round(climate),
        ecosystem: Math.round(ecosystem),
    };
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function scoreColor(score) {
    if (score >= 75) return "#4ADE80";
    if (score >= 55) return "#FBBF24";
    return "#F87171";
}
