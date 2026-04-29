// Pure geo helpers — point-in-polygon, haversine, centroid, GeoJSON walking.
// No external dependencies. Works on Polygon and MultiPolygon GeoJSON geometries.

const EARTH_R_M = 6371000;

export function toRad(deg) {
    return (deg * Math.PI) / 180;
}

// Haversine distance in metres between two {lat, lon} points.
export function haversineMeters(a, b) {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_R_M * Math.asin(Math.sqrt(h));
}

// Ray-casting point-in-polygon for a single ring [[lon,lat], ...].
function pointInRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect =
            yi > lat !== yj > lat &&
            lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

// True if (lon, lat) is inside a Polygon [outer, hole1, hole2, ...].
function pointInPolygon(lon, lat, polygon) {
    if (!polygon || polygon.length === 0) return false;
    if (!pointInRing(lon, lat, polygon[0])) return false;
    // Subtract holes
    for (let i = 1; i < polygon.length; i++) {
        if (pointInRing(lon, lat, polygon[i])) return false;
    }
    return true;
}

// Works on Polygon | MultiPolygon GeoJSON geometries.
export function pointInGeometry(lon, lat, geometry) {
    if (!geometry) return false;
    if (geometry.type === "Polygon") {
        return pointInPolygon(lon, lat, geometry.coordinates);
    }
    if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.some((poly) =>
            pointInPolygon(lon, lat, poly),
        );
    }
    return false;
}

// Returns the first feature whose polygon contains the point, or null.
export function findContainingFeature(lon, lat, featureCollection) {
    if (!featureCollection?.features) return null;
    for (const f of featureCollection.features) {
        if (pointInGeometry(lon, lat, f.geometry)) return f;
    }
    return null;
}

// Centroid of a GeoJSON geometry — coordinate average; good enough for UI.
export function centroidOf(geometry) {
    if (!geometry) return null;
    let sumLon = 0,
        sumLat = 0,
        n = 0;
    function walk(coords) {
        if (typeof coords[0] === "number") {
            sumLon += coords[0];
            sumLat += coords[1];
            n += 1;
        } else {
            coords.forEach(walk);
        }
    }
    walk(geometry.coordinates);
    return n ? { lat: sumLat / n, lon: sumLon / n } : null;
}

// Distance from {lat,lon} to nearest vertex of a geometry — cheap proximity proxy.
// (For real production use a proper segment distance, but this is good enough at
// hackathon scale and avoids pulling in turf.)
export function nearestVertexMeters(lat, lon, geometry) {
    if (!geometry) return Infinity;
    let best = Infinity;
    function walk(coords) {
        if (typeof coords[0] === "number") {
            const d = haversineMeters(
                { lat, lon },
                { lat: coords[1], lon: coords[0] },
            );
            if (d < best) best = d;
        } else {
            coords.forEach(walk);
        }
    }
    walk(geometry.coordinates);
    return best;
}