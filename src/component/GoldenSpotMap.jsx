import { useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    GeoJSON,
    CircleMarker,
    Marker,
    Popup,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { evaluateGoldenSpot, bandColor } from "../services/goldenSpot.js";
import { loadFacilities } from "../services/pollution.js";

const HALLAND_CENTER = [56.85, 12.85];
const HALLAND_ZOOM = 9;

// Custom gold marker for the evaluated spot — Leaflet's default marker icons
// rely on CSS-relative paths that break under bundlers, so we use a DivIcon.
const goldIcon = new L.DivIcon({
    className: "gs-pin",
    html: '<div class="gs-pin__inner"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

// Re-fit to the protected-area layer once on first load.
function FitToFeatures({ geojson }) {
    const map = useMap();
    const fitted = useRef(false);
    useEffect(() => {
        if (fitted.current || !geojson) return;
        try {
            const layer = L.geoJSON(geojson);
            const b = layer.getBounds();
            if (b.isValid()) {
                map.fitBounds(b, { padding: [30, 30] });
                fitted.current = true;
            }
        } catch {
            /* ignore */
        }
    }, [geojson, map]);
    return null;
}

// Capture clicks on empty map areas → run the evaluation pipeline.
function ClickEvaluator({ protectedAreas, onResult, onLoading }) {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            onLoading({ lat, lon: lng });
            try {
                const result = await evaluateGoldenSpot(lat, lng, protectedAreas);
                onResult({ lat, lon: lng, result });
            } catch (err) {
                console.error("[GoldenSpotMap] evaluate failed:", err);
                onResult({
                    lat, lon: lng,
                    result: {
                        forbidden: false, score: 0, band: "low",
                        breakdown: null,
                        reasons: ["Evaluation failed — check the dev console."],
                        raw: null,
                    },
                });
            }
        },
    });
    return null;
}

export default function GoldenSpotMap({
    protectedAreas, selectedSpot, onSpotEvaluated, onSpotLoading,
}) {
    const [facilities, setFacilities] = useState([]);

    useEffect(() => {
        loadFacilities().then(setFacilities);
    }, []);

    const protectedStyle = useMemo(() => ({
        color: "#ef4444",
        weight: 1.4,
        opacity: 0.9,
        fillColor: "#ef4444",
        fillOpacity: 0.18,
    }), []);

    return (
        <div className="gs-map">
            <MapContainer
                className="gs-map__leaflet"
                center={HALLAND_CENTER}
                zoom={HALLAND_ZOOM}
                scrollWheelZoom={true}
                attributionControl={true}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OSM'
                    subdomains="abcd"
                    maxZoom={19}
                />

                {protectedAreas && (
                    <>
                        <GeoJSON
                            data={protectedAreas}
                            style={protectedStyle}
                            onEachFeature={(feature, layer) => {
                                const p = feature.properties || {};
                                const name = p.NAMN || p.namn || p.NAME || "Protected area";
                                layer.bindTooltip("🚫 " + name, { sticky: true });
                            }}
                        />
                        <FitToFeatures geojson={protectedAreas} />
                    </>
                )}

                {facilities.map((f, i) => (
                    <CircleMarker
                        key={`f-${i}`}
                        center={[f.lat, f.lon]}
                        radius={5}
                        pathOptions={{
                            color: "#fb923c",
                            fillColor: "#fb923c",
                            fillOpacity: 0.7,
                            weight: 1,
                        }}>
                        <Popup>
                            <strong>{f.name || "Facility"}</strong>
                            <br />
                            <small>{f.activity || "industry"}</small>
                            <br />
                            <small>
                                {f.city}{f.country ? ", " + f.country : ""}
                            </small>
                            {f.pollutants && f.pollutants.length > 0 && (
                                <>
                                    <br />
                                    <small style={{ opacity: 0.8 }}>
                                        Releases: {f.pollutants.slice(0, 3).join(", ")}
                                        {f.pollutants.length > 3 ? "…" : ""}
                                    </small>
                                </>
                            )}
                        </Popup>
                    </CircleMarker>
                ))}

                <ClickEvaluator
                    protectedAreas={protectedAreas}
                    onResult={onSpotEvaluated}
                    onLoading={onSpotLoading}
                />

                {selectedSpot?.lat != null && (
                    <Marker
                        position={[selectedSpot.lat, selectedSpot.lon]}
                        icon={goldIcon}>
                        <Popup>
                            {selectedSpot.result?.forbidden ? (
                                <strong style={{ color: "#ef4444" }}>🚫 Forbidden site</strong>
                            ) : (
                                <>
                                    <strong>
                                        Suitability:{" "}
                                        <span style={{ color: bandColor(selectedSpot.result?.band) }}>
                                            {selectedSpot.result?.score ?? "…"}
                                        </span>
                                    </strong>
                                    <br />
                                    <small>
                                        {selectedSpot.lat.toFixed(4)}, {selectedSpot.lon.toFixed(4)}
                                    </small>
                                </>
                            )}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            <div className="gs-map__legend">
                <div className="gs-map__legend-title">Layers</div>
                <div className="gs-map__legend-row">
                    <span className="gs-map__swatch gs-map__swatch--protected" />
                    Protected (No-Go)
                </div>
                <div className="gs-map__legend-row">
                    <span className="gs-map__swatch gs-map__swatch--pollution" />
                    E-PRTR polluter
                </div>
                <div className="gs-map__legend-row">
                    <span className="gs-map__swatch gs-map__swatch--gold" />
                    Your evaluated spot
                </div>
                <div className="gs-map__legend-hint">
                    Click anywhere to evaluate.
                </div>
            </div>
        </div>
    );
}
