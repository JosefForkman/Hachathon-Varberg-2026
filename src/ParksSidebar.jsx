const FILTERS = [
    { key: "all", label: "All" },
    { key: "park", label: "Park" },
    { key: "reserve", label: "Reserve" },
    { key: "marine", label: "Marine" },
];

export default function ParksSidebar(props) {
    // Defensive defaults — never crash on missing props
    const features = Array.isArray(props?.features) ? props.features : [];
    const selectedId = props?.selectedId ?? null;
    const onSelect = props?.onSelect ?? (() => {});
    const filter = props?.filter ?? "all";
    const onFilterChange = props?.onFilterChange ?? (() => {});
    const query = props?.query ?? "";
    const onQueryChange = props?.onQueryChange ?? (() => {});

    return (
        <aside className="parks">
            <input
                className="parks__search"
                type="search"
                placeholder="Search areas…"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
            />

            <div className="parks__filters" role="tablist">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        className={`parks__filter ${filter === f.key ? "parks__filter--active" : ""}`}
                        onClick={() => onFilterChange(f.key)}>
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="parks__list">
                {features.length === 0 && (
                    <div
                        className="park-card"
                        style={{
                            cursor: "default",
                            textAlign: "center",
                            color: "var(--text-muted)",
                        }}>
                        No matches
                    </div>
                )}
                {features.slice(0, 50).map((f, idx) => {
                    if (!f) return null;
                    const id = f.id ?? `idx-${idx}`;
                    const active = id === selectedId;
                    const typeKey = f.typeKey || "reserve";
                    const typeLabel = f.typeLabel || "Reserve";
                    const name = f.name || "Unnamed area";
                    return (
                        <button
                            key={id}
                            type="button"
                            className={`park-card ${active ? "park-card--active" : ""}`}
                            onClick={() => onSelect(id)}>
                            <span
                                className={`park-card__type park-card__type--${typeKey}`}>
                                {typeLabel}
                            </span>
                            <div className="park-card__name">{name}</div>
                            <div className="park-card__meta">
                                {f.kommun ? `${f.kommun} · ` : ""}
                                {f.area ? formatArea(f.area) : ""}
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

function formatArea(km2) {
    if (typeof km2 !== "number" || !isFinite(km2)) return "";
    if (km2 >= 100) return `${km2.toFixed(0)} km²`;
    if (km2 >= 1) return `${km2.toFixed(1)} km²`;
    return `${(km2 * 100).toFixed(0)} ha`;
}
