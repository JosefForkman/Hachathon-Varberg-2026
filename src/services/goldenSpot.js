// Golden Spot scoring engine.
//
// Split into two phases so the Sustainability Slider can recompute the
// score *without* re-hitting Strång / Overpass / E-PRTR on every drag:
//
//   1. evaluateGoldenSpot(lat, lon, protectedAreas)
//        → fetches all data, returns { raw, ... } including raw scalars.
//   2. recomputeScore(raw, priority)
//        → pure function: pick weights from priority (0-100) and compute total.
//
// 4 dimensions: Solar (good), Infrastructure (good),
//               Pollution proximity (bad), Legal risk (bad).

import { findContainingFeature } from "../utils/geo.js";
import { fetchSolarGhi, ghiToScore, ghiToKwhPerM2Year } from "./strang.js";
import { fetchInfrastructure, infrastructureScore } from "./overpass.js";
import { nearestFacility, pollutionImpactScore } from "./pollution.js";
import {
    nearestProtectedDistance,
    legalRiskScore,
    legalRiskBand,
    fmtKm,
} from "./legalRisk.js";

/**
 * Sustainability slider 0-100:
 *   0   = Nature priority   (legal-risk + pollution dominate)
 *   50  = Balanced
 *   100 = Economic priority (solar + infra dominate)
 *
 * Returns weights that sum to 1.
 */
export function weightsForPriority(priority) {
    const t = Math.max(0, Math.min(1, priority / 100));
    // Linear interp between two named profiles
    const NATURE  = { solar: 0.15, infra: 0.15, pollution: 0.35, legalRisk: 0.35 };
    const ECONOMY = { solar: 0.50, infra: 0.40, pollution: 0.05, legalRisk: 0.05 };
    return {
        solar:     NATURE.solar     + t * (ECONOMY.solar     - NATURE.solar),
        infra:     NATURE.infra     + t * (ECONOMY.infra     - NATURE.infra),
        pollution: NATURE.pollution + t * (ECONOMY.pollution - NATURE.pollution),
        legalRisk: NATURE.legalRisk + t * (ECONOMY.legalRisk - NATURE.legalRisk),
    };
}

// ---------- Phase 1: heavy fetch ----------

export async function evaluateGoldenSpot(lat, lon, protectedAreas) {
    // Forbidden short-circuit
    const blocking = findContainingFeature(lon, lat, protectedAreas);
    if (blocking) {
        const props = blocking.properties || {};
        const name = props.NAMN || props.namn || props.NAME || props.name || "Protected area";
        const type = props.NATURTYP || props.SKYDDSTYP || props.naturtyp || "Reserve";
        return {
            forbidden: true,
            blockedBy: { name, type },
            score: 0,
            band: "forbidden",
            raw: null,
            breakdown: null,
            reasons: [
                `🚫 Inside protected area: **${name}** (${type}).`,
                "Industrial development is restricted by Swedish conservation law.",
                "Pick a site outside the red polygons.",
            ],
        };
    }

    // Run external lookups + legal-risk in parallel
    const [solar, infra, polln] = await Promise.all([
        fetchSolarGhi(lat, lon),
        fetchInfrastructure(lat, lon),
        nearestFacility(lat, lon),
    ]);
    const legalDistance = nearestProtectedDistance(lat, lon, protectedAreas);

    const raw = {
        solar,                                  // {ghi, source, samples}
        infra,                                  // {nearestRoadM, ...}
        pollution: polln,                       // {nearest, totalInRegion}
        legalDistanceM: legalDistance,
    };

    return {
        forbidden: false,
        raw,
        // Default to balanced (priority=50)
        ...recomputeScore(raw, 50),
    };
}

// ---------- Phase 2: pure reweight (no I/O) ----------

export function recomputeScore(raw, priority = 50) {
    if (!raw) return { score: 0, band: "low", breakdown: null, reasons: [] };

    const w = weightsForPriority(priority);

    const solarScore = ghiToScore(raw.solar.ghi);
    const infraScore = infrastructureScore(raw.infra);
    const pollutionDistance = raw.pollution.nearest?.distanceM ?? Infinity;
    const pollutionImpact = pollutionImpactScore(pollutionDistance);
    const legalRisk = legalRiskScore(raw.legalDistanceM);
    const legalBand = legalRiskBand(legalRisk);

    // For the 4 dims, we want HIGH = better. Pollution + legal risk are
    // cost terms (high = worse), so we invert their score before weighting.
    const total = Math.max(0, Math.min(100, Math.round(
        w.solar     * solarScore       +
        w.infra     * infraScore       +
        w.pollution * (100 - pollutionImpact) +
        w.legalRisk * (100 - legalRisk),
    )));

    const band = total >= 75 ? "high" : total >= 55 ? "mid" : "low";

    // Human-readable rationale
    const reasons = [];
    const ghi = raw.solar.ghi;
    const annualKwh = ghiToKwhPerM2Year(ghi);
    if (solarScore >= 70)
        reasons.push(`☀️ Strong solar: GHI **${ghi.toFixed(0)} W/m²** ≈ ${annualKwh} kWh/m²/yr.`);
    else if (solarScore >= 45)
        reasons.push(`☀️ Average solar: GHI ${ghi.toFixed(0)} W/m² ≈ ${annualKwh} kWh/m²/yr.`);
    else
        reasons.push(`☀️ Below-average solar (${ghi.toFixed(0)} W/m²) — co-locate wind?`);
    if (raw.solar.source === "fallback")
        reasons.push("⚠️ Strång unavailable; using fallback mean.");

    if (Number.isFinite(raw.infra.nearestRoadM))
        reasons.push(`🛣️ Nearest road **${fmtKm(raw.infra.nearestRoadM)}** away · ${raw.infra.roadCount} segments within 3 km.`);
    else
        reasons.push("🛣️ No major road within 3 km — access cost will be high.");
    if (Number.isFinite(raw.infra.nearestParkingM))
        reasons.push(`🅿️ Parking ${fmtKm(raw.infra.nearestParkingM)} away.`);

    if (raw.pollution.nearest) {
        const f = raw.pollution.nearest.facility;
        const verdict =
            pollutionDistance < 2000 ? "⚠️ Very close to major polluter — air quality + permitting risk."
          : pollutionDistance < 6000 ? "Near an existing polluter — monitor air-quality permits."
          : "Comfortable distance from existing polluters.";
        reasons.push(`🏭 Nearest E-PRTR: **${f.name || "Unnamed"}** (${f.activity || "industry"}) · ${fmtKm(pollutionDistance)}. ${verdict}`);
    } else if (raw.pollution.totalInRegion === 0) {
        reasons.push("🏭 No E-PRTR data loaded — see public/data/ instructions.");
    }

    reasons.push(`⚖️ Legal risk: **${legalBand.label}** — nearest protected area ${fmtKm(raw.legalDistanceM)}.`);

    return {
        score: total,
        band,
        breakdown: {
            solar:     { value: ghi,                 score: solarScore, label: `${annualKwh} kWh/m²/yr` },
            infra:     { value: raw.infra.nearestRoadM, score: infraScore, label: fmtKm(raw.infra.nearestRoadM) },
            pollution: { value: pollutionDistance,   score: pollutionImpact, label: raw.pollution.nearest ? fmtKm(pollutionDistance) : "no data" },
            legalRisk: { value: raw.legalDistanceM,  score: legalRisk, label: legalBand.label, band: legalBand.key },
        },
        reasons,
        weights: w,
    };
}

export function bandColor(band) {
    if (band === "forbidden") return "#ef4444";
    if (band === "high") return "#4ade80";
    if (band === "mid") return "#fbbf24";
    return "#f87171";
}