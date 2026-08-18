import { useEffect, useLayoutEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei"
import { type OrbitControls as OrbitControlsImpl } from "three-stdlib"
import * as THREE from "three"
import { getLabAudio, getLabScreenVideo } from "../lib/labMedia"

const DRACO_PATH = "/draco/"
useGLTF.setDecoderPath(DRACO_PATH)

const MODEL = "/models/lab.glb?v=20"
const AUDIO_START_TIME = 468 / 60 - 5
const MONITOR = "Cube.002"

function LabAmbience({ labMode }: { labMode: boolean }) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (!labMode) {
      const existing = document.getElementById("lab-instrumental")
      if (existing instanceof HTMLAudioElement) {
        existing.pause()
        existing.currentTime = 0
      }
      startedRef.current = false
      return
    }

    const video = getLabScreenVideo()
    video.currentTime = 0
    void video.play().catch(() => undefined)
  }, [labMode])

  useFrame(() => {
    if (!labMode) return

    const audio = getLabAudio()
    if (startedRef.current) {
      if (audio.paused) void audio.play().catch(() => undefined)
      return
    }

    const video = document.getElementById("lab-screen-video")
    if (!(video instanceof HTMLVideoElement)) return
    if (video.currentTime < AUDIO_START_TIME) return

    startedRef.current = true
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
  })

  return null
}

function isDeskScreen(obj: THREE.Object3D): obj is THREE.Mesh {
  if (!(obj instanceof THREE.Mesh)) return false
  let node: THREE.Object3D | null = obj
  while (node) {
    if (node.name === MONITOR) return true
    node = node.parent
  }
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
  return mats.some((mat) => typeof mat?.name === "string" && /losck\s*screen/i.test(mat.name))
}

function ensurePlanarUVs(geometry: THREE.BufferGeometry) {
  const pos = geometry.getAttribute("position")
  if (!pos) return
  const existing = geometry.getAttribute("uv")
  if (existing && existing.count === pos.count) return

  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  if (!box) return
  const sx = box.max.x - box.min.x || 1
  const sy = box.max.y - box.min.y || 1
  const uvs = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = (pos.getX(i) - box.min.x) / sx
    uvs[i * 2 + 1] = (pos.getY(i) - box.min.y) / sy
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
}

function MonitorVideo({ root }: { root: THREE.Object3D }) {
  const gl = useThree((state) => state.gl)
  const mapRef = useRef<THREE.VideoTexture | null>(null)

  useEffect(() => {
    let cancelled = false
    let video: HTMLVideoElement | null = null
    let map: THREE.VideoTexture | null = null
    let screenMat: THREE.MeshBasicMaterial | null = null
    const originals: Array<{ mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }> = []
    const screenRoot = root.getObjectByName(MONITOR)
    const originalZ = screenRoot?.position.z
    let poll = 0
    let idle = 0
    let timer = 0

    const apply = () => {
      if (cancelled || map || !video || video.videoWidth < 2) return

      map = new THREE.VideoTexture(video)
      map.colorSpace = gl.outputColorSpace
      map.flipY = true
      map.generateMipmaps = false
      map.minFilter = THREE.LinearFilter
      map.magFilter = THREE.LinearFilter
      gl.initTexture(map)
      mapRef.current = map

      const mat = new THREE.MeshBasicMaterial({
        map,
        toneMapped: false,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -8,
        polygonOffsetUnits: -8,
      })
      screenMat = mat

      root.traverse((obj) => {
        if (!isDeskScreen(obj)) return
        ensurePlanarUVs(obj.geometry)
        originals.push({ mesh: obj, material: obj.material })
        obj.material = mat
        obj.renderOrder = 2
        obj.frustumCulled = false
      })

      if (screenRoot && originalZ != null) {
        screenRoot.position.z = originalZ + 0.02
        screenRoot.updateMatrixWorld()
      }

      void video.play().catch(() => undefined)
    }

    const start = () => {
      if (cancelled) return
      video = getLabScreenVideo()
      video.addEventListener("loadedmetadata", apply)
      video.addEventListener("loadeddata", apply)
      video.addEventListener("canplay", apply)
      video.addEventListener("playing", apply)
      apply()
      poll = window.setInterval(apply, 250)
      void video.play().catch(() => undefined)
    }

    if (typeof requestIdleCallback === "function") {
      idle = requestIdleCallback(start, { timeout: 1800 })
    } else {
      timer = window.setTimeout(start, 400)
    }

    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.clearTimeout(timer)
      if (idle && typeof cancelIdleCallback === "function") cancelIdleCallback(idle)
      video?.removeEventListener("loadedmetadata", apply)
      video?.removeEventListener("loadeddata", apply)
      video?.removeEventListener("canplay", apply)
      video?.removeEventListener("playing", apply)
      if (screenRoot && originalZ != null) screenRoot.position.z = originalZ
      for (const { mesh, material } of originals) {
        mesh.material = material
        mesh.renderOrder = 0
      }
      map?.dispose()
      screenMat?.dispose()
      mapRef.current = null
    }
  }, [root, gl])

  useFrame(() => {
    const map = mapRef.current
    const video = map?.image
    if (!map || !(video instanceof HTMLVideoElement)) return
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) map.needsUpdate = true
  })

  return null
}

const POSTERS = new Set(["Cube.091", "Cube.092", "Cube.093"])
const MONITOR_NODES = new Set(["Cube.002", "Cube"])
const HIDE = new Set([
  "center mirror",
  "center mirror.002",
  "Camera_close",
  "Sphere.002",
])
const PENDANT = "Chocofur_free_34_light.001"

const ROOM_TARGET = new THREE.Vector3(-1.15, 1.4, -0.5)
const WIDE_CAMERA = new THREE.Vector3(3.9, 3.45, 16.8)
const WIDE_FOV = 45
const CAM_BOUNDS = {
  minX: -5.5,
  maxX: 5.5,
  minY: 1.2,
  maxY: 4.5,
  minZ: 8.6,
  maxZ: 22,
}

type Props = {
  labMode: boolean
  onPoster: () => void
  onMonitor: () => void
}

function namedAncestor(object: THREE.Object3D | null) {
  let current = object
  while (current) {
    if (POSTERS.has(current.name) || MONITOR_NODES.has(current.name)) return current.name
    const mat = current instanceof THREE.Mesh
      ? (Array.isArray(current.material) ? current.material[0] : current.material)
      : null
    if (typeof mat?.name === "string" && /^Mat_poster/i.test(mat.name)) return current.name || "poster"
    current = current.parent
  }
  return ""
}

function isMonitorHotspot(name: string) {
  return MONITOR_NODES.has(name)
}

function applyWideLens(camera: THREE.Camera) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return
  camera.near = 0.1
  camera.far = 250
  camera.fov = WIDE_FOV
  camera.updateProjectionMatrix()
}

function WideRoomCamera({ labMode }: { labMode: boolean }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useLayoutEffect(() => {
    applyWideLens(camera)
  }, [camera, size])

  useFrame(() => {
    if (labMode) return
    camera.position.copy(WIDE_CAMERA)
    camera.lookAt(ROOM_TARGET)
    applyWideLens(camera)
  })

  return null
}

function LabOrbit({ enabled }: { enabled: boolean }) {
  const camera = useThree((state) => state.camera)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useLayoutEffect(() => {
    if (!enabled) return
    camera.position.copy(WIDE_CAMERA)
    applyWideLens(camera)
    const controls = controlsRef.current
    if (!controls) return
    controls.target.copy(ROOM_TARGET)
    controls.update()
  }, [camera, enabled])

  useFrame(() => {
    if (!enabled) return
    const { x, y, z } = camera.position
    camera.position.set(
      THREE.MathUtils.clamp(x, CAM_BOUNDS.minX, CAM_BOUNDS.maxX),
      THREE.MathUtils.clamp(y, CAM_BOUNDS.minY, CAM_BOUNDS.maxY),
      THREE.MathUtils.clamp(z, CAM_BOUNDS.minZ, CAM_BOUNDS.maxZ),
    )
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      enablePan={false}
      makeDefault={enabled}
      target={ROOM_TARGET.toArray()}
      minDistance={11}
      maxDistance={22}
      minPolarAngle={0.78}
      maxPolarAngle={1.46}
      minAzimuthAngle={-1.15}
      maxAzimuthAngle={1.15}
    />
  )
}

function LabHotspots({
  root,
  onPoster,
  onMonitor,
}: {
  root: THREE.Object3D
  onPoster: () => void
  onMonitor: () => void
}) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const onPosterRef = useRef(onPoster)
  const onMonitorRef = useRef(onMonitor)
  onPosterRef.current = onPoster
  onMonitorRef.current = onMonitor

  useEffect(() => {
    const targets: THREE.Mesh[] = []
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      if (!namedAncestor(obj)) return
      targets.push(obj)
    })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let downX = 0
    let downY = 0

    const toNdc = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return false
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      return true
    }

    const hitName = () => {
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(targets, false)
      return hits.length ? namedAncestor(hits[0].object) : ""
    }

    const onDown = (event: PointerEvent) => {
      downX = event.clientX
      downY = event.clientY
    }

    const onUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 8) return
      if (!toNdc(event)) return
      const name = hitName()
      if (!name) return
      event.preventDefault()
      if (isMonitorHotspot(name)) onMonitorRef.current()
      else onPosterRef.current()
    }

    const onMove = (event: PointerEvent) => {
      if (!toNdc(event)) return
      gl.domElement.style.cursor = hitName() ? "pointer" : "default"
    }

    const el = gl.domElement
    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointermove", onMove)
    return () => {
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointerup", onUp)
      el.removeEventListener("pointermove", onMove)
      el.style.cursor = ""
    }
  }, [root, gl, camera])

  return null
}

export function LabScene({ labMode, onPoster, onMonitor }: Props) {
  const { scene, animations } = useGLTF(MODEL, DRACO_PATH)
  const root = scene
  const { actions } = useAnimations(animations, root)

  useLayoutEffect(() => {
    root.traverse((obj) => {
      if (HIDE.has(obj.name)) {
        obj.visible = false
        return
      }

      if (obj instanceof THREE.DirectionalLight) {
        obj.intensity = 1.2
        obj.color.set("#fff1dc")
        obj.castShadow = false
      }

      if (obj instanceof THREE.PointLight || obj instanceof THREE.SpotLight) {
        if (obj.name === "Light.002") {
          obj.intensity = 28
          obj.distance = 28
          obj.color.set("#fff4dd")
        } else if (obj.name === "Spot.001") {
          obj.intensity = 18
          obj.distance = 16
        } else if (obj.intensity > 2000) {
          obj.intensity = 12
          obj.distance = 18
        } else {
          obj.intensity = 8
          obj.distance = 16
        }
        obj.decay = 2
        obj.castShadow = false
      }

      if (obj instanceof THREE.Mesh) {
        obj.castShadow = false
        obj.receiveShadow = false
        const geom = obj.geometry
        if (geom) {
          if (geom.boundingSphere === null) geom.computeBoundingSphere()
          if (geom.boundingBox === null) geom.computeBoundingBox()
        }
        const matName = Array.isArray(obj.material) ? obj.material[0]?.name : obj.material?.name
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        if (/glass/i.test(obj.name) || (typeof matName === "string" && /glass/i.test(matName))) {
          obj.raycast = () => {}
        }

        const keepAlive =
          obj instanceof THREE.SkinnedMesh ||
          obj.name === "Bruno" ||
          obj.name === PENDANT ||
          obj.name === MONITOR ||
          obj.name === "CarpetShag"
        obj.frustumCulled = !keepAlive

        if (obj.name === PENDANT || obj.parent?.name === PENDANT) {
          for (const mat of mats) {
            if (mat && "emissive" in mat) {
              mat.emissive = new THREE.Color("#fff1c8")
              mat.emissiveIntensity = 2.2
            }
          }
        }

        if (typeof obj.name === "string" && obj.name.startsWith("background-wall")) {
          for (const mat of mats) {
            if (mat) mat.side = THREE.DoubleSide
          }
        }

        const isPoster =
          POSTERS.has(obj.name) ||
          (obj.parent != null && POSTERS.has(obj.parent.name)) ||
          (typeof matName === "string" && matName.startsWith("Mat_poster"))
        if (isPoster) {
          for (const mat of mats) {
            if (mat) mat.side = THREE.DoubleSide
          }
        }

        const isCarpet =
          obj.name === "CarpetShag" ||
          obj.name === "Carpet" ||
          matName === "Material.016"
        if (isCarpet) {
          for (const mat of mats) {
            if (mat && "color" in mat) {
              mat.color.set("#7c6a5b")
              if ("roughness" in mat) mat.roughness = 0.95
            }
          }
        }
      }
    })
  }, [root])

  useEffect(() => {
    const clip = actions["BRUNO_sit_stand"]
    if (!clip) return
    clip.reset()
    clip.setLoop(THREE.LoopOnce, 1)
    clip.clampWhenFinished = true
    clip.play()
    return () => {
      clip.stop()
    }
  }, [actions])

  return (
    <>
      <primitive object={root} />
      <LabHotspots root={root} onPoster={onPoster} onMonitor={onMonitor} />
      <MonitorVideo root={root} />
      <LabAmbience labMode={labMode} />
      <WideRoomCamera labMode={labMode} />
      <LabOrbit enabled={labMode} />
    </>
  )
}

useGLTF.preload(MODEL, DRACO_PATH)
