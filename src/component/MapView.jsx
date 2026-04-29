import { useEffect, useMemo, useState } from "react";
import GoldenSpotMap from "../component/GoldenSpotMap.jsx";
import GoldenSpotSidebar from "../component/GoldenSpotSidebar.jsx";
import EmailGate from "../Emailgate.jsx";
import { recomputeScore } from "../services/goldenSpot.js";

export default function MapView() {
    const [protectedAreas, setProtectedAreas] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [priority, setPriority] = useState(50); // 0=Nature, 100=Economic
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

    // Live re-weight when slider moves — pure function, no fetches.
    const reweighted = useMemo(() => {
        if (!selectedSpot?.result || selectedSpot.result.forbidden) return selectedSpot;
        if (!selectedSpot.result.raw) return selectedSpot;
        const fresh = recomputeScore(selectedSpot.result.raw, priority);
        return {
            ...selectedSpot,
            result: { ...selectedSpot.result, ...fresh },
        };
    }, [selectedSpot, priority]);

    return (
        <main className="gs-page">
            <div className="gs-page__head">
                <div>
                    <h1 className="gs-page__title">Golden Spot Finder</h1>
                    <p className="gs-page__sub">
                        Industrial solar site suitability for Halland — Solar +
                        Infrastructure − Pollution − Legal risk, with hard
                        exclusion of protected areas.
                    </p>
                </div>
            </div>

            <div className="gs-page__body">
                <GoldenSpotMap
                    protectedAreas={protectedAreas}
                    selectedSpot={reweighted}
                    onSpotEvaluated={handleSpotEvaluated}
                    onSpotLoading={handleSpotLoading}
                />
                <GoldenSpotSidebar
                    selectedSpot={reweighted}
                    priority={priority}
                    onPriorityChange={setPriority}
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
