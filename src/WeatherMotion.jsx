import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { fetchHallandForecast, symbolToLottie, symbolToLabel } from '../services/smhi.js'

// Emoji fallback when Lottie file is missing
const EMOJI = {
  clear: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  fog: '🌫️',
  rain: '🌧️',
  'heavy-rain': '⛈️',
  thunder: '⚡',
  snow: '❄️',
}

export default function WeatherMotion() {
  const [forecast, setForecast] = useState(null)
  const [animation, setAnimation] = useState(null)
  const [animKey, setAnimKey] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetchHallandForecast()
      .then((data) => { if (alive) setForecast(data) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!forecast) return
    const key = symbolToLottie(forecast.symbol)
    setAnimKey(key)
    fetch(`/lottie/${key}.json`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setAnimation(data))
      .catch(() => setAnimation(null))
  }, [forecast])

  if (error || !forecast) {
    return (
      <div className="weather" title="Weather forecast">
        <div className="weather__lottie weather__lottie--fallback">⛅</div>
        <div className="weather__info">
          <div className="weather__temp">--°</div>
          <div className="weather__desc">Halmstad</div>
        </div>
      </div>
    )
  }

  return (
    <div className="weather" title={`SMHI forecast — ${symbolToLabel(forecast.symbol)}`}>
      {animation ? (
        <Lottie animationData={animation} loop className="weather__lottie" />
      ) : (
        <div className="weather__lottie weather__lottie--fallback">
          {EMOJI[animKey] || '⛅'}
        </div>
      )}
      <div className="weather__info">
        <div className="weather__temp">
          {forecast.temp != null ? `${Math.round(forecast.temp)}°C` : '--°'}
        </div>
        <div className="weather__desc">{symbolToLabel(forecast.symbol)}</div>
      </div>
    </div>
  )
}
