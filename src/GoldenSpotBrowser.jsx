import { useEffect, useMemo, useState } from "react";
import GoldenSpotMap from "./component/GoldenSpotMap.jsx";
import GoldenSpotSidebar from "./component/GoldenSpotSidebar.jsx";
import PlacesPanel from "./component/PlacesPanel.jsx";
import { recomputeScore, evaluateGoldenSpot } from "./services/goldenSpot.js";

export default function GoldenSpotBrowser({ onPremiumClick }) {
    const [protectedAreas, setProtectedAreas] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [priority, setPriority] = useState(50);

    useEffect(() => {
        fetch("/data/halland_skyddade_omraden.geojson")
            .then((r) => (r.ok ? r.json() : Promise.reject("not found")))
            .then(setProtectedAreas)
            .catch((err) => console.error("[browser] geojson:", err));
    }, []);

    const reweighted = useMemo(() => {
        if (!selectedSpot?.result || selectedSpot.result.forbidden) return selectedSpot;
        if (!selectedSpot.result.raw) return selectedSpot;
        const fresh = recomputeScore(selectedSpot.result.raw, priority);
        return { ...selectedSpot, result: { ...selectedSpot.result, ...fresh } };
    }, [selectedSpot, priority]);

    // Click on a place card → evaluate its centroid as a Golden Spot
    async function handlePlaceClick(place) {
        if (!place.centroid) return;
        const { lat, lon } = place.centroid;
        setSelectedSpot({ lat, lon, result: null });
        try {
            const result = await evaluateGoldenSpot(lat, lon, protectedAreas);
            setSelectedSpot({ lat, lon, result });
        } catch (err) {
            console.error("[browser] place eval failed:", err);
        }
    }

    return (
        <div className="browser">
            <div className="browser__chrome">
                <div className="browser__dots">
                    <span className="browser__dot browser__dot--r" />
                    <span className="browser__dot browser__dot--y" />
                    <span className="browser__dot browser__dot--g" />
                </div>
                <div className="browser__url">s-halland.app/explore</div>
            </div>
            <div className="gs-browser__body gs-browser__body--3col">
                <PlacesPanel
                    protectedAreas={protectedAreas}
                    onPlaceClick={handlePlaceClick}
                />
                <GoldenSpotMap
                    protectedAreas={protectedAreas}
                    selectedSpot={reweighted}
                    onSpotEvaluated={setSelectedSpot}
                    onSpotLoading={(coord) => setSelectedSpot({ ...coord, result: null })}
                />
                <GoldenSpotSidebar
                    selectedSpot={reweighted}
                    priority={priority}
                    onPriorityChange={setPriority}
                    onDownloadReport={onPremiumClick}
                />
            </div>
        </div>
    );
}
