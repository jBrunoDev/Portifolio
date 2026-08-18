import { Suspense, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { useProgress } from "@react-three/drei"
import { LabScene } from "./LabScene"

type Props = {
  labMode: boolean
  onPoster: () => void
  onMonitor: () => void
}

function LoadHint() {
  const { active, progress, errors } = useProgress()
  const [ready, setReady] = useState(false)
  const percent = Math.max(1, Math.min(100, Math.round(progress)))

  useEffect(() => {
    if (!active && progress >= 100) setReady(true)
  }, [active, progress])

  if (ready) return null
  if (errors.length > 0 && !active) {
    return <div className="lab-loading">Falha ao carregar o lab</div>
  }

  return (
    <div className="lab-loading">
      <span>{active ? `Carregando o lab ${percent}%` : "Preparando o lab"}</span>
      <span className="lab-loading-bar" aria-hidden>
        <span style={{ width: active ? `${percent}%` : "8%" }} />
      </span>
    </div>
  )
}

export function LabCanvas({ labMode, onPoster, onMonitor }: Props) {
  return (
    <div className="hero-canvas">
      <LoadHint />
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: [3.9, 3.45, 16.8],
          fov: 45,
          near: 0.1,
          far: 250,
        }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.35
        }}
        style={{ background: "#0d0f14" }}
      >
        <color attach="background" args={["#0d0f14"]} />
        <hemisphereLight args={["#c5cce8", "#1a1418", 0.45]} />
        <ambientLight intensity={0.22} color="#d7d9ea" />
        <Suspense fallback={null}>
          <LabScene labMode={labMode} onPoster={onPoster} onMonitor={onMonitor} />
        </Suspense>
      </Canvas>
    </div>
  )
}
