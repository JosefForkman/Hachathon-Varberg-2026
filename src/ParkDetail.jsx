import { useMemo } from "react";
import { computeScore } from "./services/score.js";

export default function ParkDetail({ area, weather, onPremiumClick }) {
    const score = useMemo(
        () => (area ? computeScore(area, weather) : null),
        [area, weather],
    );

    if (!area) {
        return (
            <aside className="detail">
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Select an area to see details.
                </div>
            </aside>
        );
    }

    return (
        <aside className="detail">
            <span className={`detail__type park-card__type--${area.typeKey}`}>
                {area.typeLabel}
            </span>
            <div className="detail__name">{area.name}</div>
            <div className="detail__sub">
                {area.kommun || "Halland"}
                {area.established
                    ? ` · Established ${String(area.established).slice(0, 4)}`
                    : ""}
            </div>

            <div className="detail__stats">
                <div className="detail__stat">
                    <div className="detail__stat-label">Area</div>
                    <div className="detail__stat-value">
                        {area.area ? formatArea(area.area) : "—"}
                    </div>
                </div>
                <div className="detail__stat">
                    <div className="detail__stat-label">Score</div>
                    <div className="detail__stat-value">
                        {score?.total ?? "—"}
                    </div>
                </div>
            </div>

            <div className="detail__bars">
                <Bar label="Biodiversity" value={score?.biodiversity} />
                <Bar label="Climate resilience" value={score?.climate} />
                <Bar label="Ecosystem health" value={score?.ecosystem} />
            </div>

            <button className="detail__premium" onClick={onPremiumClick}>
                🔒 Unlock full report (PDF · CSV)
            </button>
        </aside>
    );
}

function Bar({ label, value }) {
    const v = Number.isFinite(value) ? value : 0;
    return (
        <div className="detail__bar-row">
            <div className="detail__bar-label">
                <span>{label}</span>
                <span className="detail__bar-value">{v}</span>
            </div>
            <div className="detail__bar-track">
                <div className="detail__bar-fill" style={{ width: `${v}%` }} />
            </div>
        </div>
    );
}

function formatArea(km2) {
    if (km2 >= 100) return `${km2.toFixed(0)} km²`;
    if (km2 >= 1) return `${km2.toFixed(1)} km²`;
    return `${(km2 * 100).toFixed(0)} ha`;
}
