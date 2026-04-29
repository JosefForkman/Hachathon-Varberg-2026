// OSM Overpass API — proximity to roads and parking.
// Public instance, no key. Heavy queries get throttled, so we keep them
// tight and cache aggressively.

import { haversineMeters } from "../utils/geo.js";

const CACHE_PREFIX = "s-halland:overpass:";
const CACHE_MS = 24 * 60 * 60 * 1000; // 1 day
const SEARCH_RADIUS_M = 3000;

const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
];

function gridKey(lat, lon) {
    // ~1.1 km grid — fine enough for proximity scoring, coarse enough to share cache.
    return `${CACHE_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;
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

async function runOverpass(query) {
    let lastErr;
    for (const endpoint of ENDPOINTS) {
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: query,
            });
            if (!res.ok) throw new Error(`Overpass ${res.status}`);
            return await res.json();
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr;
}

/**
 * Returns the nearest road/parking distances (metres) plus a feature count
 * inside the search radius, useful for the "infrastructure access" score.
 *
 * Result shape:
 *   {
 *     nearestRoadM: number | Infinity,
 *     nearestParkingM: number | Infinity,
 *     roadCount: number,
 *     parkingCount: number,
 *     source: 'overpass' | 'fallback'
 *   }
 */
export async function fetchInfrastructure(lat, lon) {
    const key = gridKey(lat, lon);
    const cached = readCache(key);
    if (cached) return cached;

    const r = SEARCH_RADIUS_M;
    const query = `
[out:json][timeout:20];
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified"](around:${r},${lat},${lon});
  way["amenity"="parking"](around:${r},${lat},${lon});
  node["amenity"="parking"](around:${r},${lat},${lon});
);
out tags geom 200;
`.trim();

    try {
        const json = await runOverpass(query);
        const elements = Array.isArray(json.elements) ? json.elements : [];
        let nearestRoadM = Infinity;
        let nearestParkingM = Infinity;
        let roadCount = 0;
        let parkingCount = 0;

        for (const el of elements) {
            const tags = el.tags || {};
            const isParking = tags.amenity === "parking";
            const isRoad = !!tags.highway;
            // Build sample points: node lat/lon, or first vertex of way geom
            const pts = [];
            if (el.type === "node" && Number.isFinite(el.lat))
                pts.push({ lat: el.lat, lon: el.lon });
            if (Array.isArray(el.geometry)) {
                for (const g of el.geometry)
                    pts.push({ lat: g.lat, lon: g.lon });
            }
            if (pts.length === 0) continue;
            let best = Infinity;
            for (const p of pts) {
                const d = haversineMeters({ lat, lon }, p);
                if (d < best) best = d;
            }
            if (isRoad) {
                roadCount += 1;
                if (best < nearestRoadM) nearestRoadM = best;
            }
            if (isParking) {
                parkingCount += 1;
                if (best < nearestParkingM) nearestParkingM = best;
            }
        }

        const data = {
            nearestRoadM,
            nearestParkingM,
            roadCount,
            parkingCount,
            source: "overpass",
        };
        writeCache(key, data);
        return data;
    } catch (err) {
        console.warn("[overpass] fallback —", err.message);
        return {
            nearestRoadM: Infinity,
            nearestParkingM: Infinity,
            roadCount: 0,
            parkingCount: 0,
            source: "fallback",
        };
    }
}

// Convert proximity to a 0–100 access score. Closer = higher.
// 0 m → 100, 500 m → ~85, 1500 m → ~50, 3000 m → ~10.
export function infrastructureScore({ nearestRoadM, roadCount }) {
    if (!Number.isFinite(nearestRoadM)) {
        // No roads in radius — penalise hard but not zero.
        return Math.min(20, 5 + Math.min(roadCount, 3) * 5);
    }
    const distanceScore = Math.max(
        0,
        Math.min(100, Math.round(100 * Math.exp(-nearestRoadM / 1200))),
    );
    // Density bonus: more roads ≈ better connected.
    const densityBonus = Math.min(15, roadCount * 1.5);
    return Math.min(100, Math.round(distanceScore * 0.85 + densityBonus));
}