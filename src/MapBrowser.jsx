import { useEffect, useMemo, useState } from 'react'
import MapView from './MapView.jsx'
import ParksSidebar from './ParksSidebar.jsx'
import ParkDetail from './ParkDetail.jsx'
import { fetchHallandForecast } from './services/smhi.js'
import { classifyType } from './services/score.js'

// Try to read a "name" from common GeoJSON property naming conventions.
function readName(props) {
  return (
    props?.NAMN ||
    props?.namn ||
    props?.NAME ||
    props?.name ||
    props?.OMRADE ||
    props?.SKYDDSTYP ||
    'Unnamed area'
  )
}
function readType(props) {
  return (
    props?.NATURTYP ||
    props?.SKYDDSTYP ||
    props?.naturtyp ||
    props?.skyddstyp ||
    props?.TYPE ||
    props?.type ||
    'Reserve'
  )
}
function readKommun(props) {
  return props?.KOMMUN || props?.kommun || props?.LANSNAMN || ''
}
function readEstablished(props) {
  return props?.URSGALLDAT || props?.IKRAFTDAT || props?.year || ''
}
function readAreaKm2(props) {
  const ha = props?.AREA_HA || props?.area_ha || props?.AREAL_HA
  if (ha) return Number(ha) / 100
  const km2 = props?.AREA_KM2 || props?.area_km2
  if (km2) return Number(km2)
  return null
}

function centroidOf(geometry) {
  if (!geometry) return null
  let sumLon = 0, sumLat = 0, n = 0
  function walk(coords) {
    if (typeof coords[0] === 'number') {
      sumLon += coords[0]; sumLat += coords[1]; n += 1
    } else {
      coords.forEach(walk)
    }
  }
  walk(geometry.coordinates)
  return n ? { lat: sumLat / n, lon: sumLon / n } : null
}

export default function MapBrowser({ onPremiumClick }) {
  const [features, setFeatures] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    fetch('/data/halland_skyddade_omraden.geojson')
      .then((r) => {
        if (!r.ok) throw new Error('GeoJSON not found at /data/halland_skyddade_omraden.geojson')
        return r.json()
      })
      .then((geo) => {
        const feats = (geo.features || []).map((f, i) => {
          const props = f.properties || {}
          const c = centroidOf(f.geometry)
          const cls = classifyType(readType(props))
          return {
            id: props.OBJECTID || props.id || `f-${i}`,
            name: readName(props),
            type: readType(props),
            typeKey: cls.cssMod,
            typeLabel: cls.label,
            kommun: readKommun(props),
            established: readEstablished(props),
            area: readAreaKm2(props),
            centroid: c,
            geometry: f.geometry,
            raw: f,
          }
        })
        setFeatures(feats)
        if (feats.length > 0) setSelectedId(feats[0].id)
      })
      .catch((err) => {
        console.error(err)
        setLoadError(err.message)
      })
  }, [])

  useEffect(() => {
    fetchHallandForecast().then(setWeather).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return features.filter((f) => {
      if (filter !== 'all' && f.typeKey !== filter) return false
      if (q && !f.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [features, filter, query])

  const selected = useMemo(
    () => features.find((f) => f.id === selectedId) || null,
    [features, selectedId]
  )

  return (
    <div className="browser">
      <div className="browser__chrome">
        <div className="browser__dots">
          <span className="browser__dot browser__dot--r" />
          <span className="browser__dot browser__dot--y" />
          <span className="browser__dot browser__dot--g" />
        </div>
        <div className="browser__url">sweden-atlas.app/explore</div>
      </div>
      <div className="browser__body">
        <ParksSidebar
          features={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filter={filter}
          onFilterChange={setFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <MapView
          features={features}
          selected={selected}
          onSelect={setSelectedId}
          loadError={loadError}
        />
        <ParkDetail
          area={selected}
          weather={weather}
          onPremiumClick={onPremiumClick}
        />
      </div>
    </div>
  )
}
