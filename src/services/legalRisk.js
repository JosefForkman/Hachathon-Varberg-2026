// Legal-risk metric for industrial siting.
// Inside a protected polygon → "Forbidden" (handled upstream as score 0).
// Outside → continuous risk based on distance to nearest NVR boundary.
//
//   <  500 m  → high risk    (score 60-90; close to a reserve =
//                              expect appeals, environmental impact assessment)
//   500-2000m → medium risk  (score 30-60)
//   > 2000 m  → low risk     (score 0-30)

import { nearestVertexMeters } from "../utils/geo.js";

export function nearestProtectedDistance(lat, lon, featureCollection) {
    if (!featureCollection?.features) return Infinity;
    let best = Infinity;
    for (const f of featureCollection.features) {
        const d = nearestVertexMeters(lat, lon, f.geometry);
        if (d < best) best = d;
    }
    return best;
}

// Score 0-100 where 100 = highest risk (closest to a reserve).
// Exponential decay: 0 m → 100, 1000 m → ~37, 3000 m → ~5.
export function legalRiskScore(distanceM) {
    if (!Number.isFinite(distanceM)) return 0;
    return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-distanceM / 1000))));
}

export function legalRiskBand(score) {
    if (score >= 60) return { key: "high", label: "High" };
    if (score >= 30) return { key: "medium", label: "Medium" };
    return { key: "low", label: "Low" };
}

export function fmtKm(m) {
    if (!Number.isFinite(m)) return "—";
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}