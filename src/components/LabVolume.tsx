import { useEffect, useRef, useState } from "react"
import { getLabAudio } from "../lib/labMedia"

const DEFAULT_VOLUME = 30

export function LabVolume({ visible }: { visible: boolean }) {
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const lastVolume = useRef(DEFAULT_VOLUME)

  useEffect(() => {
    if (!visible) return
    getLabAudio().volume = volume / 100
  }, [volume, visible])

  if (!visible) return null

  const apply = (next: number) => {
    const clamped = Math.max(0, Math.min(100, next))
    setVolume(clamped)
    if (clamped > 0) lastVolume.current = clamped
  }

  return (
    <div className="lab-volume">
      <button
        type="button"
        className="lab-volume-btn"
        aria-label={volume === 0 ? "Ativar som" : "Silenciar"}
        onClick={() => apply(volume === 0 ? lastVolume.current || DEFAULT_VOLUME : 0)}
      >
        <SpeakerIcon muted={volume === 0} />
      </button>
      <input
        className="lab-volume-slider"
        type="range"
        min={0}
        max={100}
        value={volume}
        aria-label="Volume da música"
        onChange={(event) => apply(Number(event.target.value))}
      />
    </div>
  )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.5 9.2h3.1L12 5.6v12.8L7.6 14.8H4.5A1.3 1.3 0 0 1 3.2 13.5v-3a1.3 1.3 0 0 1 1.3-1.3Z"
      />
      {muted ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M16.2 9.2 20 14.8M20 9.2l-3.8 5.6"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          d="M15.3 9.4a3.6 3.6 0 0 1 0 5.2M17.7 7.2a7 7 0 0 1 0 9.6"
        />
      )}
    </svg>
  )
}
