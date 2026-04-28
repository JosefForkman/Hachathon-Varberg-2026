import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computeScore, scoreColor } from './services/score.js'

const HALLAND_CENTER = [56.85, 12.85]
const HALLAND_ZOOM = 9

function FitBounds({ features }) {
  const map = useMap()
  useEffect(() => {
    if (!features || features.length === 0) return
    try {
      const layer = L.geoJSON({
        type: 'FeatureCollection',
        features: features.map((f) => f.raw),
      })
      const b = layer.getBounds()
      if (b.isValid()) map.fitBounds(b, { padding: [20, 20] })
    } catch {}
  }, [features, map])
  return null
}

function PanToSelected({ selected }) {
  const map = useMap()
  useEffect(() => {
    if (!selected?.centroid) return
    map.flyTo([selected.centroid.lat, selected.centroid.lon], Math.max(map.getZoom(), 10), {
      duration: 0.6,
    })
  }, [selected, map])
  return null
}

export default function MapView({ features, selected, onSelect, loadError }) {
  const scoreById = useMemo(() => {
    const m = new Map()
    for (const f of features) m.set(f.id, computeScore(f, null))
    return m
  }, [features])

  const styleFor = (feature, id) => {
    const s = scoreById.get(id) || { total: 60 }
    const isSelected = selected?.id === id
    return {
      color: scoreColor(s.total),
      weight: isSelected ? 2.5 : 1.2,
      opacity: isSelected ? 1 : 0.7,
      fillColor: scoreColor(s.total),
      fillOpacity: isSelected ? 0.55 : 0.25,
    }
  }

  return (
    <div className="map">
      <MapContainer
        className="map__leaflet"
        center={HALLAND_CENTER}
        zoom={HALLAND_ZOOM}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OSM'
          subdomains="abcd"
          maxZoom={19}
        />

        {features.map((f) => {
          const isSel = selected?.id === f.id
          return (
            <GeoJSON
              key={`${f.id}-${isSel ? 'on' : 'off'}`}
              data={f.raw}
              style={() => styleFor(f.raw, f.id)}
              eventHandlers={{
                click: () => onSelect(f.id),
                mouseover: (e) => e.target.setStyle({ fillOpacity: 0.5, weight: 2 }),
                mouseout: (e) => e.target.setStyle(styleFor(f.raw, f.id)),
              }}
            />
          )
        })}

        {features.length > 0 && <FitBounds features={features} />}
        <PanToSelected selected={selected} />
      </MapContainer>

      {loadError && (
        <div className="map__loading">
          <div>
            <strong>GeoJSON not loaded.</strong>
            <br />
            Place file at <code>public/data/halland_skyddade_omraden.geojson</code>
          </div>
        </div>
      )}
      {!loadError && features.length === 0 && (
        <div className="map__loading">Loading protected areas…</div>
      )}

      <div className="map__legend">
        <div className="map__legend-title">Sustainability score</div>
        <div className="map__legend-row">
          <span className="map__legend-dot" style={{ color: '#4ADE80', background: '#4ADE80' }} />
          High (75+)
        </div>
        <div className="map__legend-row">
          <span className="map__legend-dot" style={{ color: '#FBBF24', background: '#FBBF24' }} />
          Medium
        </div>
        <div className="map__legend-row">
          <span className="map__legend-dot" style={{ color: '#F87171', background: '#F87171' }} />
          At risk
        </div>
      </div>
    </div>
  )
}
