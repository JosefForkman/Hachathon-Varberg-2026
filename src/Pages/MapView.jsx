import { useEffect, useMemo, useState } from "react";
import GoldenSpotMap from "../component/GoldenSpotMap.jsx";
import GoldenSpotSidebar from "../component/GoldenSpotSidebar.jsx";
import { recomputeScore } from "../services/goldenSpot.js";
import {
    getStoredEmail,
    setStoredEmail,
    isValidEmail,
} from "../utils/storage.js";

export default function MapView() {
    const [protectedAreas, setProtectedAreas] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [priority, setPriority] = useState(50);
    const [unlocked, setUnlocked] = useState(() => !!getStoredEmail());

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

    const reweighted = useMemo(() => {
        if (!selectedSpot?.result || selectedSpot.result.forbidden) return selectedSpot;
        if (!selectedSpot.result.raw) return selectedSpot;
        const fresh = recomputeScore(selectedSpot.result.raw, priority);
        return { ...selectedSpot, result: { ...selectedSpot.result, ...fresh } };
    }, [selectedSpot, priority]);

    if (!unlocked) {
        return (
            <UnlockGate onUnlock={() => setUnlocked(true)} />
        );
    }

    return (
        <main className="gs-page gs-page--full">
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
                    onDownloadReport={() => {}}
                />
            </div>

            {loadError && (
                <div className="gs-page__error">
                    Failed to load protected areas:{" "}
                    <code>public/data/halland_skyddade_omraden.geojson</code>
                </div>
            )}
        </main>
    );
}

// ---------- Inline email-unlock gate ----------
function UnlockGate({ onUnlock }) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    function onSubmit(e) {
        e.preventDefault();
        if (!isValidEmail(email)) {
            setError("Please enter a valid work email");
            return;
        }
        setStoredEmail(email.trim());
        onUnlock();
    }

    return (
        <main className="gs-unlock">
            <div className="gs-unlock__card">
                <div className="gs-unlock__icon">🔒</div>
                <h2 className="gs-unlock__title">Unlock the full Golden Spot Finder</h2>
                <p className="gs-unlock__sub">
                    Drop your work email to access the full-screen interactive
                    map — solar heatmap, click-to-score, sustainability slider,
                    and feasibility report. No spam, no resale.
                </p>
                <form className="gs-unlock__form" onSubmit={onSubmit}>
                    <input
                        type="email"
                        className="gs-unlock__input"
                        placeholder="you@organization.se"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        autoFocus
                        required
                    />
                    {error && <div className="gs-unlock__error">{error}</div>}
                    <button type="submit" className="gs-unlock__submit">
                        Unlock full-screen map →
                    </button>
                </form>
                <ul className="gs-unlock__perks">
                    <li>✓ Click anywhere to score (Solar + Infra − Pollution − Legal)</li>
                    <li>✓ Live SMHI Strång GHI heatmap</li>
                    <li>✓ Sustainability slider: Nature ⇄ Economic priority</li>
                    <li>✓ E-PRTR pollution registry overlay</li>
                </ul>
            </div>
        </main>
    );
}
