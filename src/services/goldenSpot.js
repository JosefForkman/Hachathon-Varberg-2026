// Golden Spot scoring engine — composes Solar + Infra − Pollution into a
// single 0–100 industrial-suitability score. A click inside any NVR
// (protected-area) polygon short-circuits to a Forbidden result with score 0.

import { findContainingFeature } from "../utils/geo.js";
import { fetchSolarGhi, ghiToScore } from "./strang.js";
import {
    fetchInfrastructure,
    infrastructureScore,
} from "./overpass.js";
import { nearestFacility, pollutionImpactScore } from "./pollution.js";

// Weights — tweak in one place.
const WEIGHTS = {
    solar: 0.45,
    infrastructure: 0.35,
    pollution: 0.20, // subtracted (impact)
};

function fmtKm(m) {
    if (!Number.isFinite(m)) return "—";
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

/**
 * Run the full pipeline for a clicked coordinate.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {object} protectedAreas  GeoJSON FeatureCollection (NVR polygons)
 * @returns {Promise<GoldenSpotResult>}
 *
 * Result shape:
 *   {
 *     forbidden: boolean,
 *     blockedBy?: { name, type },
 *     score: number,            // 0–100
 *     band: 'forbidden'|'low'|'mid'|'high',
 *     breakdown: {
 *       solar:        { value, score, label },
 *       infrastructure:{ value, score, label },
 *       pollution:    { value, score, label }   // here `score` is *impact*
 *     },
 *     reasons: string[],        // human-readable bullets
 *     raw: { ghi, infra, pollution }
 *   }
 */
export async function evaluateGoldenSpot(lat, lon, protectedAreas) {
    // 1. Forbidden short-circuit
    const blocking = findContainingFeature(lon, lat, protectedAreas);
    if (blocking) {
        const props = blocking.properties || {};
        const name =
            props.NAMN || props.namn || props.NAME || props.name || "Protected area";
        const type =
            props.NATURTYP || props.SKYDDSTYP || props.naturtyp || "Reserve";
        return {
            forbidden: true,
            blockedBy: { name, type },
            score: 0,
            band: "forbidden",
            breakdown: null,
            reasons: [
                `🚫 Inside protected area: **${name}** (${type}).`,
                "Industrial development is restricted by Swedish conservation law.",
                "Pick a site outside the red polygons.",
            ],
            raw: null,
        };
    }

    // 2. Run external lookups in parallel
    const [solar, infra, polln] = await Promise.all([
        fetchSolarGhi(lat, lon),
        fetchInfrastructure(lat, lon),
        nearestFacility(lat, lon),
    ]);

    // 3. Sub-scores
    const solarScore = ghiToScore(solar.ghi);
    const infraScore = infrastructureScore(infra);
    const pollutionDistance = polln.nearest?.distanceM ?? Infinity;
    const pollutionImpact = pollutionImpactScore(pollutionDistance);

    // 4. Final weighted score
    const total = Math.max(
        0,
        Math.min(
            100,
            Math.round(
                WEIGHTS.solar * solarScore +
                    WEIGHTS.infrastructure * infraScore -
                    WEIGHTS.pollution * pollutionImpact +
                    // Re-add a flat "clean" baseline so a far-from-pollution site
                    // benefits rather than just "doesn't lose points".
                    WEIGHTS.pollution * (100 - pollutionImpact),
            ),
        ),
    );

    // 5. Band
    const band = total >= 75 ? "high" : total >= 55 ? "mid" : "low";

    // 6. Human-readable rationale
    const reasons = [];
    if (solarScore >= 70)
        reasons.push(
            `☀️ Strong solar resource — daily-mean GHI **${solar.ghi.toFixed(0)} W/m²** (top tier for Halland).`,
        );
    else if (solarScore >= 45)
        reasons.push(
            `☀️ Average solar — daily-mean GHI ${solar.ghi.toFixed(0)} W/m².`,
        );
    else
        reasons.push(
            `☀️ Below-average solar (GHI ${solar.ghi.toFixed(0)} W/m²) — consider co-locating wind.`,
        );
    if (solar.source === "fallback")
        reasons.push("⚠️ Strång unavailable; using Halland climatological mean.");

    if (Number.isFinite(infra.nearestRoadM)) {
        reasons.push(
            `🛣️ Nearest road **${fmtKm(infra.nearestRoadM)}** away · ${infra.roadCount} road segments within 3 km.`,
        );
    } else {
        reasons.push("🛣️ No major road within 3 km — access cost will be high.");
    }
    if (Number.isFinite(infra.nearestParkingM))
        reasons.push(`🅿️ Parking available ${fmtKm(infra.nearestParkingM)} away.`);

    if (polln.nearest) {
        const f = polln.nearest.facility;
        const verdict =
            pollutionDistance < 2000
                ? "⚠️ Very close to a major polluter — air quality + permitting risk."
                : pollutionDistance < 6000
                  ? "Near an existing polluter — monitor air-quality permits."
                  : "Comfortable distance from existing polluters.";
        reasons.push(
            `🏭 Nearest E-PRTR facility: **${f.name || "Unnamed"}** (${f.activity || "industry"}) · ${fmtKm(pollutionDistance)} away. ${verdict}`,
        );
    } else if (polln.totalInRegion === 0) {
        reasons.push(
            "🏭 No E-PRTR pollution data loaded — add `F1_4_Air_Releases_Facilities_Nordics.csv` to `public/data/`.",
        );
    }

    return {
        forbidden: false,
        score: total,
        band,
        breakdown: {
            solar: {
                value: solar.ghi,
                score: solarScore,
                label: `${solar.ghi.toFixed(0)} W/m²`,
            },
            infrastructure: {
                value: infra.nearestRoadM,
                score: infraScore,
                label: fmtKm(infra.nearestRoadM),
            },
            pollution: {
                value: pollutionDistance,
                score: pollutionImpact,
                label: polln.nearest ? fmtKm(pollutionDistance) : "no data",
            },
        },
        reasons,
        raw: { solar, infra, pollution: polln },
    };
}

// Map score band to brand colour (matches tokens.css).
export function bandColor(band) {
    if (band === "forbidden") return "#ef4444";
    if (band === "high") return "#4ade80";
    if (band === "mid") return "#fbbf24";
    return "#f87171";
}