import { useMemo, useState } from "react";

// Read property variants
function readName(p) {
    return p?.NAMN || p?.namn || p?.NAME || p?.name || "Unnamed area";
}
function readNaturtyp(p) {
    return String(p?.NATURTYP || p?.naturtyp || p?.NATURE_TYPE || "").toLowerCase();
}
function readSkyddstyp(p) {
    return String(p?.SKYDDSTYP || p?.skyddstyp || p?.PROTECTION || "").toLowerCase();
}
function readKommun(p) {
    return p?.KOMMUN || p?.kommun || "";
}
function readAreaKm2(p) {
    const ha = p?.AREA_HA || p?.area_ha || p?.AREAL_HA;
    if (ha) return Number(ha) / 100;
    return null;
}
function centroidOf(geometry) {
    if (!geometry) return null;
    let lon = 0, lat = 0, n = 0;
    function walk(c) {
        if (typeof c[0] === "number") { lon += c[0]; lat += c[1]; n++; }
        else c.forEach(walk);
    }
    walk(geometry.coordinates);
    return n ? { lat: lat / n, lon: lon / n } : null;
}

// Classify into one or more category buckets — a single area can belong
// to multiple (e.g. Bird Sanctuary + Natura 2000).
function classify(props) {
    const t = readNaturtyp(props);
    const s = readSkyddstyp(props);
    const all = `${t} ${s}`;
    const tags = [];
    if (all.includes("fågel") || all.includes("bird")) tags.push("bird");
    if (all.includes("kust") || all.includes("coast") || all.includes("marin"))
        tags.push("coastal");
    if (all.includes("hed") || all.includes("heath")) tags.push("heath");
    if (all.includes("sjö") || all.includes("lake")) tags.push("lake");
    if (all.includes("skog") || all.includes("forest")) tags.push("forest");
    if (s.includes("natura") || all.includes("natura 2000") || all.includes("n2000"))
        tags.push("n2000");
    if (s.includes("nationalpark") || all.includes("national")) tags.push("park");
    if (s.includes("reservat") || all.includes("reserve") || tags.length === 0)
        tags.push("reserve");
    return tags;
}

const TAG_LABEL = {
    park: "National Park",
    reserve: "Nature Reserve",
    bird: "Bird Sanctuary",
    coastal: "Coastal",
    heath: "Heath",
    lake: "Lake",
    forest: "Forest",
    n2000: "N2000",
};

// Filter chips — the order shown to user
const FILTERS = [
    { key: "all", label: "All" },
    { key: "reserve", label: "Reserve" },
    { key: "bird", label: "Bird" },
    { key: "coastal", label: "Coastal" },
    { key: "heath", label: "Heath" },
    { key: "lake", label: "Lake" },
    { key: "n2000", label: "Natura 2000" },
];

const VIEWS = [
    { key: "all", label: "All views" },
    { key: "municipality", label: "Municipality" },
    { key: "property", label: "Property" },
];

function fmtArea(km2) {
    if (typeof km2 !== "number" || !isFinite(km2)) return "";
    if (km2 >= 100) return `${km2.toFixed(0)} km²`;
    if (km2 >= 1) return `${km2.toFixed(1)} km²`;
    return `${(km2 * 100).toFixed(0)} ha`;
}

export default function PlacesPanel({ protectedAreas, onPlaceClick }) {
    const [view, setView] = useState("all");
    const [filter, setFilter] = useState("all");
    const [query, setQuery] = useState("");

    const places = useMemo(() => {
        if (!protectedAreas?.features) return [];
        return protectedAreas.features.map((f, i) => {
            const p = f.properties || {};
            const tags = classify(p);
            return {
                id: p.OBJECTID || p.id || `f-${i}`,
                name: readName(p),
                tags,
                primaryTag: tags.find((t) => t !== "n2000") || tags[0],
                hasN2000: tags.includes("n2000"),
                kommun: readKommun(p),
                area: readAreaKm2(p),
                centroid: centroidOf(f.geometry),
            };
        });
    }, [protectedAreas]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = places.filter((p) => {
            if (filter !== "all" && !p.tags.includes(filter)) return false;
            if (q) {
                const haystack = `${p.name} ${p.kommun}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
        // Sort by view mode
        if (view === "municipality") {
            list.sort((a, b) =>
                (a.kommun || "zzz").localeCompare(b.kommun || "zzz") ||
                a.name.localeCompare(b.name),
            );
        } else if (view === "property") {
            list.sort((a, b) => (b.area || 0) - (a.area || 0));
        } else {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list;
    }, [places, filter, query, view]);

    return (
        <aside className="gs-places">
            {/* Tab switcher */}
            <div className="gs-places__tabs">
                {VIEWS.map((v) => (
                    <button
                        key={v.key}
                        type="button"
                        className={`gs-places__tab ${view === v.key ? "gs-places__tab--active" : ""}`}
                        onClick={() => setView(v.key)}>
                        {v.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="gs-places__search-wrap">
                <svg className="gs-places__search-icon" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                    className="gs-places__search"
                    type="search"
                    placeholder="Search areas, municipalities…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Chips */}
            <div className="gs-places__filters">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        className={`gs-places__filter ${filter === f.key ? "gs-places__filter--active" : ""}`}
                        onClick={() => setFilter(f.key)}>
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="gs-places__count">
                {filtered.length} of {places.length}
            </div>

            {/* Cards */}
            <div className="gs-places__list">
                {filtered.length === 0 && (
                    <div className="gs-places__empty">No matches</div>
                )}
                {filtered.slice(0, 100).map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        className="gs-places__card"
                        onClick={() => onPlaceClick && onPlaceClick(p)}>
                        <div className="gs-places__badges">
                            <span className={`gs-places__badge gs-places__badge--${p.primaryTag}`}>
                                {(TAG_LABEL[p.primaryTag] || "Reserve").toUpperCase()}
                            </span>
                            {p.hasN2000 && (
                                <span className="gs-places__badge gs-places__badge--n2000">
                                    N2000
                                </span>
                            )}
                        </div>
                        <div className="gs-places__name">{p.name}</div>
                        <div className="gs-places__meta">
                            {p.kommun ? p.kommun : ""}
                            {p.kommun && p.area ? "  ·  " : ""}
                            {fmtArea(p.area)}
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
}
