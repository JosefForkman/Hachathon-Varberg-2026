import { useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer, TileLayer, GeoJSON, CircleMarker, Marker, Popup,
    LayerGroup, useMap, useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { evaluateGoldenSpot, bandColor } from "../services/goldenSpot.js";
import { loadFacilities } from "../services/pollution.js";
import { loadSolarGrid, ghiToHeatColor } from "../services/strang.js";

const HALLAND_CENTER = [56.85, 12.85];
const HALLAND_ZOOM = 9;

const goldIcon = new L.DivIcon({
    className: "gs-pin",
    html: '<div class="gs-pin__inner"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

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
        } catch { /* ignore */ }
    }, [geojson, map]);
    return null;
}

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
    const [solarGrid, setSolarGrid] = useState([]);
    const [showSolar, setShowSolar] = useState(true);
    const [showProtected, setShowProtected] = useState(true);
    const [showPolluters, setShowPolluters] = useState(true);

    useEffect(() => { loadFacilities().then(setFacilities); }, []);
    useEffect(() => { loadSolarGrid().then(setSolarGrid); }, []);

    const protectedStyle = useMemo(() => ({
        color: "#ef4444",
        weight: 1.4,
        opacity: 0.9,
        fillColor: "#ef4444",
        fillOpacity: 0.18,
    }), []);

    // Calibrate the heat scale to *this* grid's range so colour variation
    // is visible even when the spread is tight (e.g. 250-267 W/m²).
    const heatRange = useMemo(() => {
        if (!solarGrid.length) return { min: 245, max: 270 };
        const ghis = solarGrid.map((p) => p.ghi);
        return { min: Math.min(...ghis), max: Math.max(...ghis) };
    }, [solarGrid]);

    return (
        <div className="gs-map">
            <MapContainer
                className="gs-map__leaflet"
                center={HALLAND_CENTER}
                zoom={HALLAND_ZOOM}
                scrollWheelZoom={true}
                zoomControl={true}
                attributionControl={true}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OSM'
                    subdomains="abcd"
                    maxZoom={19}
                />

                {/* Solar heatmap layer — large translucent circles */}
                {showSolar && (
                    <LayerGroup>
                        {solarGrid.map((p, i) => (
                            <CircleMarker
                                key={`sol-${i}`}
                                center={[p.lat, p.lon]}
                                radius={28}
                                pathOptions={{
                                    color: ghiToHeatColor(p.ghi, heatRange.min, heatRange.max),
                                    fillColor: ghiToHeatColor(p.ghi, heatRange.min, heatRange.max),
                                    fillOpacity: 0.32,
                                    opacity: 0.55,
                                    weight: 1,
                                    interactive: true,
                                }}>
                                <Popup>
                                    <strong>Solar potential</strong>
                                    <br />
                                    GHI {p.ghi.toFixed(1)} W/m²
                                    <br />
                                    <small>≈ {Math.round(p.ghi * 24 * 365 / 1000)} kWh/m²/yr</small>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </LayerGroup>
                )}

                {/* Protected areas (red) */}
                {showProtected && protectedAreas && (
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

                {/* E-PRTR polluters (orange) */}
                {showPolluters && facilities.map((f, i) => (
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
                    <Marker position={[selectedSpot.lat, selectedSpot.lon]} icon={goldIcon}>
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

            {/* Layer toggle + legend */}
            <div className="gs-map__legend">
                <div className="gs-map__legend-title">Layers</div>
                <label className="gs-map__legend-row">
                    <input
                        type="checkbox"
                        checked={showSolar}
                        onChange={(e) => setShowSolar(e.target.checked)}
                    />
                    <span className="gs-map__swatch gs-map__swatch--solar" />
                    Solar GHI
                </label>
                <label className="gs-map__legend-row">
                    <input
                        type="checkbox"
                        checked={showProtected}
                        onChange={(e) => setShowProtected(e.target.checked)}
                    />
                    <span className="gs-map__swatch gs-map__swatch--protected" />
                    Protected (No-Go)
                </label>
                <label className="gs-map__legend-row">
                    <input
                        type="checkbox"
                        checked={showPolluters}
                        onChange={(e) => setShowPolluters(e.target.checked)}
                    />
                    <span className="gs-map__swatch gs-map__swatch--pollution" />
                    E-PRTR polluter
                </label>
                <div className="gs-map__legend-row">
                    <span className="gs-map__swatch gs-map__swatch--gold" />
                    Your evaluated spot
                </div>
                {showSolar && solarGrid.length > 0 && (
                    <div className="gs-map__solar-scale">
                        <div className="gs-map__solar-bar" />
                        <div className="gs-map__solar-ticks">
                            <span>{Math.round(heatRange.min)}</span>
                            <span>{Math.round((heatRange.min + heatRange.max) / 2)}</span>
                            <span>{Math.round(heatRange.max)} W/m²</span>
                        </div>
                    </div>
                )}
                <div className="gs-map__legend-hint">Click anywhere to evaluate.</div>
            </div>
        </div>
    );
}
