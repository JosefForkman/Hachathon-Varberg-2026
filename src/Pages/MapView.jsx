import { useEffect, useState } from "react";
import GoldenSpotMap from "../component/GoldenSpotMap.jsx";
import GoldenSpotSidebar from "../component/GoldenSpotSidebar.jsx";
import EmailGate from "../Emailgate.jsx";

// Golden Spot Finder — the /map route.
// Click anywhere on the Halland basemap to evaluate the location for
// industrial solar suitability. Click inside a red polygon → Forbidden.
export default function MapView() {
    const [protectedAreas, setProtectedAreas] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [gateOpen, setGateOpen] = useState(false);

    useEffect(() => {
        fetch("/data/halland_skyddade_omraden.geojson")
            .then((r) => {
                if (!r.ok) throw new Error("GeoJSON not found");
                return r.json();
            })
            .then(setProtectedAreas)
            .catch((err) => {
                console.error(err);
                setLoadError(err.message);
            });
    }, []);

    function handleSpotLoading(coord) {
        setSelectedSpot({ ...coord, result: null });
    }
    function handleSpotEvaluated(payload) {
        setSelectedSpot(payload);
    }
    function handleDownloadReport() {
        setGateOpen(true);
    }

    return (
        <main className="gs-page">
            <div className="gs-page__head">
                <div>
                    <h1 className="gs-page__title">Golden Spot Finder</h1>
                    <p className="gs-page__sub">
                        Industrial solar site suitability for Halland — Solar +
                        Infrastructure − Pollution, with hard exclusion of
                        protected areas.
                    </p>
                </div>
            </div>

            <div className="gs-page__body">
                <GoldenSpotMap
                    protectedAreas={protectedAreas}
                    selectedSpot={selectedSpot}
                    onSpotEvaluated={handleSpotEvaluated}
                    onSpotLoading={handleSpotLoading}
                />
                <GoldenSpotSidebar
                    selectedSpot={selectedSpot}
                    onDownloadReport={handleDownloadReport}
                />
            </div>

            {loadError && (
                <div className="gs-page__error">
                    Failed to load protected areas:{" "}
                    <code>public/data/halland_skyddade_omraden.geojson</code>
                </div>
            )}

            <EmailGate
                open={gateOpen}
                reason="premium"
                onClose={() => setGateOpen(false)}
            />
        </main>
    );
}
