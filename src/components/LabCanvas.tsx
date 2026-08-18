import { type RefObject, Suspense, useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { useProgress } from "@react-three/drei"
import { LabScene } from "./LabScene"

type Props = {
  labMode: boolean
  onPoster: () => void
  onMonitor: () => void
}

function useCapDpr() {
  const [dpr, setDpr] = useState<number | [number, number]>(1)

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)")
    const narrow = window.matchMedia("(max-width: 900px)")
    const apply = () => {
      const memory = "deviceMemory" in navigator ? Number(navigator.deviceMemory) : 8
      const cores = navigator.hardwareConcurrency || 8
      const low = coarse.matches || narrow.matches || memory <= 4 || cores <= 4
      setDpr(low ? 1 : [1, 1.25])
    }
    apply()
    coarse.addEventListener("change", apply)
    narrow.addEventListener("change", apply)
    return () => {
      coarse.removeEventListener("change", apply)
      narrow.removeEventListener("change", apply)
    }
  }, [])

  return dpr
}

function useOnScreen(ref: RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.12,
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return onScreen
}

function LoadHint() {
  const { active, progress, errors } = useProgress()
  const [ready, setReady] = useState(false)
  const [hide, setHide] = useState(false)
  const percent = Math.max(1, Math.min(100, Math.round(progress)))

  useEffect(() => {
    if (!active && progress >= 100) {
      const wait = window.setTimeout(() => setReady(true), 180)
      return () => window.clearTimeout(wait)
    }
  }, [active, progress])

  useEffect(() => {
    if (!ready) return
    const wait = window.setTimeout(() => setHide(true), 420)
    return () => window.clearTimeout(wait)
  }, [ready])

  if (hide) return null
  if (errors.length > 0 && !active) {
    return <div className="lab-loading">Falha ao carregar o lab</div>
  }

  return (
    <div className={ready ? "lab-loading is-done" : "lab-loading"} aria-hidden={ready}>
      <span>{active ? `Carregando o lab ${percent}%` : "Preparando o lab"}</span>
      <span className="lab-loading-bar">
        <span style={{ width: active ? `${percent}%` : "8%" }} />
      </span>
    </div>
  )
}

export function LabCanvas({ labMode, onPoster, onMonitor }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const dpr = useCapDpr()
  const onScreen = useOnScreen(wrapRef)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    setMobile(window.matchMedia("(pointer: coarse), (max-width: 900px)").matches)
  }, [])

  return (
    <div className="hero-canvas" ref={wrapRef}>
      <LoadHint />
      <Canvas
        dpr={dpr}
        frameloop={onScreen ? "always" : "never"}
        camera={{
          position: [3.9, 3.45, 16.8],
          fov: 45,
          near: 0.1,
          far: 250,
        }}
        gl={{
          antialias: !mobile,
          alpha: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
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
