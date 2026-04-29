// E-PRTR Air Releases Facilities (Nordics) — pollution proximity service.
//
// Expects: public/data/F1_4_Air_Releases_Facilities_Nordics.csv
// Each row is one (facility, pollutant) pair, so we dedupe by
// FacilityInspireId and aggregate the pollutants list.

import { haversineMeters } from "../utils/geo.js";

const CSV_URL = "/data/F1_4_Air_Releases_Facilities_Nordics.csv";
const HALLAND_BBOX = {
    // Padded slightly to catch facilities just over the border that still
    // affect Halland air quality.
    minLat: 56.2,
    maxLat: 57.4,
    minLon: 11.6,
    maxLon: 13.6,
};

let cachedFacilities = null;
let inflight = null;

// Tiny CSV parser — handles quoted fields with embedded commas. Strips a
// UTF-8 BOM if present.
function parseCsv(text) {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ",") {
                row.push(field);
                field = "";
            } else if (c === "\n") {
                row.push(field);
                rows.push(row);
                row = [];
                field = "";
            } else if (c === "\r") {
                /* ignore */
            } else {
                field += c;
            }
        }
    }
    if (field.length || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

const COL_ALIASES = {
    lat: ["latitude", "lat", "facilitylatitude", "y", "geocoordinatesy"],
    lon: ["longitude", "lon", "lng", "facilitylongitude", "x", "geocoordinatesx"],
    name: ["facilityname", "name", "site", "sitename"],
    city: ["city", "town", "municipality"],
    country: ["country", "countrycode", "countryname"],
    activity: [
        "eprtrsectorname",
        "eprtrannexlmainactivity",
        "eprtrannelimainactivity",
        "mainactivityname",
        "mainactivity",
        "sectorname",
        "iaactivityname",
        "industry",
    ],
    facilityId: ["facilityinspireid", "inspireid", "facilityid"],
    pollutant: ["pollutant"],
    releases: ["releases", "release"],
};

function buildColumnMap(headerRow) {
    const norm = headerRow.map((h) =>
        String(h || "").toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    const map = {};
    for (const key of Object.keys(COL_ALIASES)) {
        map[key] = -1;
        for (const alias of COL_ALIASES[key]) {
            const idx = norm.indexOf(alias);
            if (idx !== -1) {
                map[key] = idx;
                break;
            }
        }
    }
    return map;
}

function withinHalland(lat, lon) {
    return (
        lat >= HALLAND_BBOX.minLat &&
        lat <= HALLAND_BBOX.maxLat &&
        lon >= HALLAND_BBOX.minLon &&
        lon <= HALLAND_BBOX.maxLon
    );
}

export async function loadFacilities() {
    if (cachedFacilities) return cachedFacilities;
    if (inflight) return inflight;
    inflight = (async () => {
        try {
            const res = await fetch(CSV_URL);
            if (!res.ok) {
                console.warn(`[pollution] CSV not found at ${CSV_URL}.`);
                cachedFacilities = [];
                return cachedFacilities;
            }
            const text = await res.text();
            const rows = parseCsv(text);
            if (rows.length < 2) {
                cachedFacilities = [];
                return cachedFacilities;
            }
            const cols = buildColumnMap(rows[0]);
            if (cols.lat === -1 || cols.lon === -1) {
                console.warn("[pollution] CSV missing lat/lon columns.");
                cachedFacilities = [];
                return cachedFacilities;
            }
            const byKey = new Map();
            for (let i = 1; i < rows.length; i++) {
                const r = rows[i];
                const lat = parseFloat(r[cols.lat]);
                const lon = parseFloat(r[cols.lon]);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
                if (!withinHalland(lat, lon)) continue;
                const key =
                    (cols.facilityId >= 0 && r[cols.facilityId]) ||
                    `${lat.toFixed(5)}|${lon.toFixed(5)}`;
                let entry = byKey.get(key);
                if (!entry) {
                    entry = {
                        lat, lon,
                        name: cols.name >= 0 ? r[cols.name] : "Facility",
                        city: cols.city >= 0 ? r[cols.city] : "",
                        country: cols.country >= 0 ? r[cols.country] : "",
                        activity: cols.activity >= 0 ? r[cols.activity] : "",
                        pollutants: new Set(),
                    };
                    byKey.set(key, entry);
                }
                if (cols.pollutant >= 0 && r[cols.pollutant]) {
                    entry.pollutants.add(r[cols.pollutant]);
                }
            }
            const out = [];
            for (const e of byKey.values()) {
                out.push({
                    lat: e.lat, lon: e.lon, name: e.name, city: e.city,
                    country: e.country, activity: e.activity,
                    pollutants: Array.from(e.pollutants),
                });
            }
            cachedFacilities = out;
            return out;
        } catch (err) {
            console.warn("[pollution] load failed:", err.message);
            cachedFacilities = [];
            return cachedFacilities;
        }
    })();
    return inflight;
}

export async function nearestFacility(lat, lon) {
    const facilities = await loadFacilities();
    if (facilities.length === 0) return { nearest: null, totalInRegion: 0 };
    let bestD = Infinity, best = null;
    for (const f of facilities) {
        const d = haversineMeters({ lat, lon }, { lat: f.lat, lon: f.lon });
        if (d < bestD) { bestD = d; best = f; }
    }
    return {
        nearest: best ? { distanceM: bestD, facility: best } : null,
        totalInRegion: facilities.length,
    };
}

// Pollution-impact 0-100 (100 = worst). <1km≈90, 3km≈60, 7km≈30, >12km≈5.
export function pollutionImpactScore(distanceM) {
    if (!Number.isFinite(distanceM)) return 0;
    const km = distanceM / 1000;
    return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-km / 4))));
}