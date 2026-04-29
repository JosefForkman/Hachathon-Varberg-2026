import { bandColor } from "../services/goldenSpot.js";

function ScoreDonut({ score, band }) {
    const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
    const C = 2 * Math.PI * 42;
    const dash = (safeScore / 100) * C;
    const colour = bandColor(band);

    return (
        <div className="gs-donut">
            <svg viewBox="0 0 100 100" className="gs-donut__svg">
                <circle cx="50" cy="50" r="42" className="gs-donut__track" fill="none" strokeWidth="8" />
                <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={colour}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${C - dash}`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dasharray 400ms ease, stroke 400ms ease" }}
                />
                <text x="50" y="55" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text-primary)">
                    {safeScore}
                </text>
            </svg>
            <div className="gs-donut__caption">Site Suitability</div>
        </div>
    );
}

function MetricBar({ label, score, value, danger }) {
    const v = Math.max(0, Math.min(100, Math.round(score || 0)));
    return (
        <div className="gs-bar">
            <div className="gs-bar__head">
                <span className="gs-bar__label">{label}</span>
                <span className="gs-bar__value">{value}</span>
            </div>
            <div className="gs-bar__track">
                <div className={`gs-bar__fill ${danger ? "gs-bar__fill--danger" : ""}`} style={{ width: `${v}%` }} />
            </div>
        </div>
    );
}

function LegalRiskBar({ band, distance }) {
    const colour = band === "high" ? "#ef4444" : band === "medium" ? "#fbbf24" : "#4ade80";
    const fillPct = band === "high" ? 90 : band === "medium" ? 55 : 20;
    return (
        <div className="gs-bar">
            <div className="gs-bar__head">
                <span className="gs-bar__label">Legal risk</span>
                <span className="gs-bar__value" style={{ color: colour }}>
                    {band ? band.charAt(0).toUpperCase() + band.slice(1) : "—"}
                </span>
            </div>
            <div className="gs-bar__track">
                <div className="gs-bar__fill" style={{ width: `${fillPct}%`, background: colour }} />
            </div>
            <div className="gs-bar__sub">Nearest reserve: {distance}</div>
        </div>
    );
}

function PrioritySlider({ priority, onChange, weights }) {
    return (
        <div className="gs-slider">
            <div className="gs-slider__head">
                <span className="gs-slider__label-l">🌿 Nature</span>
                <span className="gs-slider__label-r">Economic 💼</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={priority}
                onChange={(e) => onChange(Number(e.target.value))}
                className="gs-slider__input"
            />
            <div className="gs-slider__weights">
                <span title="Solar weight">☀️ {(weights.solar * 100).toFixed(0)}%</span>
                <span title="Infrastructure weight">🛣️ {(weights.infra * 100).toFixed(0)}%</span>
                <span title="Pollution weight">🏭 {(weights.pollution * 100).toFixed(0)}%</span>
                <span title="Legal risk weight">⚖️ {(weights.legalRisk * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
}

function Empty() {
    return (
        <aside className="gs-side gs-side--empty">
            <div className="gs-side__hero">
                <div className="gs-side__hero-title">Golden Spot Finder</div>
                <p className="gs-side__hero-sub">
                    Click anywhere on the map to score that location for solar +
                    industrial development. Sites inside protected (red) areas
                    are auto-flagged as Forbidden.
                </p>
                <ul className="gs-side__legend">
                    <li><span className="gs-side__dot gs-side__dot--high" /> 75+ Golden</li>
                    <li><span className="gs-side__dot gs-side__dot--mid" /> 55-74 Promising</li>
                    <li><span className="gs-side__dot gs-side__dot--low" /> Below 55 Marginal</li>
                    <li><span className="gs-side__dot gs-side__dot--forbidden" /> Forbidden</li>
                </ul>
            </div>
        </aside>
    );
}

function Loading({ coord }) {
    return (
        <aside className="gs-side gs-side--loading">
            <div className="gs-spinner" />
            <div className="gs-side__loading-title">Scoring location…</div>
            {coord && (
                <div className="gs-side__loading-sub">
                    {coord.lat.toFixed(4)}, {coord.lon.toFixed(4)}
                </div>
            )}
            <div className="gs-side__loading-list">
                <div>Checking conservation overlap…</div>
                <div>Pulling SMHI Strång GHI…</div>
                <div>Querying OSM road network…</div>
                <div>Scanning E-PRTR registry…</div>
            </div>
        </aside>
    );
}

export default function GoldenSpotSidebar({
    selectedSpot, priority, onPriorityChange, onDownloadReport,
}) {
    if (!selectedSpot) return <Empty />;
    if (!selectedSpot.result) return <Loading coord={selectedSpot} />;

    const { result, lat, lon } = selectedSpot;

    if (result.forbidden) {
        return (
            <aside className="gs-side gs-side--forbidden">
                <div className="gs-side__forbidden-icon">🚫</div>
                <div className="gs-side__forbidden-title">Forbidden Site</div>
                <div className="gs-side__forbidden-sub">Inside a Naturreservat / NVR polygon</div>
                <div className="gs-side__forbidden-name">{result.blockedBy?.name}</div>
                <ul className="gs-side__reasons">
                    {result.reasons.map((r, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: mdLite(r) }} />
                    ))}
                </ul>
                <div className="gs-side__coord">{lat.toFixed(4)}, {lon.toFixed(4)}</div>
            </aside>
        );
    }

    const b = result.breakdown;
    const w = result.weights || { solar: 0.25, infra: 0.25, pollution: 0.25, legalRisk: 0.25 };

    return (
        <aside className="gs-side">
            <ScoreDonut score={result.score} band={result.band} />
            <div className="gs-side__coord">{lat.toFixed(4)}, {lon.toFixed(4)}</div>

            <h4 className="gs-side__h">Sustainability priority</h4>
            <PrioritySlider
                priority={priority}
                onChange={onPriorityChange}
                weights={w}
            />

            <h4 className="gs-side__h">Score breakdown</h4>
            <MetricBar
                label="Solar potential"
                score={b.solar.score}
                value={b.solar.label}
            />
            <MetricBar
                label="Infrastructure access"
                score={b.infra.score}
                value={b.infra.label}
            />
            <MetricBar
                label="Pollution proximity"
                score={b.pollution.score}
                value={b.pollution.label}
                danger
            />
            <LegalRiskBar
                band={b.legalRisk.band}
                distance={
                    Number.isFinite(b.legalRisk.value)
                        ? (b.legalRisk.value >= 1000
                            ? (b.legalRisk.value / 1000).toFixed(1) + " km"
                            : Math.round(b.legalRisk.value) + " m")
                        : "—"
                }
            />

            <h4 className="gs-side__h">Why is this a Golden Spot?</h4>
            <ul className="gs-side__reasons">
                {result.reasons.map((r, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: mdLite(r) }} />
                ))}
            </ul>

            <button className="gs-side__cta" onClick={() => onDownloadReport(selectedSpot)}>
                📥 Download Site Prospectus
            </button>
            <div className="gs-side__cta-sub">PDF · GeoJSON · CSV — emailed to you.</div>
        </aside>
    );
}

function mdLite(s) {
    const safe = String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
