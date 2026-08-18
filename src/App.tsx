import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { LabVolume } from "./components/LabVolume"
import { ProjectsPage } from "./components/ProjectsPage"
import { Sections } from "./components/Sections"
import { site } from "./data/site"
import { capture, capturePageview } from "./lib/analytics"
import "./index.css"

const LabCanvas = lazy(async () => {
  const mod = await import("./components/LabCanvas")
  return { default: mod.LabCanvas }
})

const PROJECTS_PATH = "/projetos"

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/"
}

function HeroTimeTracker() {
  const entered = useRef<number | null>(null)

  useEffect(() => {
    const hero = document.getElementById("hero")
    if (!hero) return

    const flush = () => {
      if (entered.current == null) return
      const seconds = Math.round((performance.now() - entered.current) / 1000)
      entered.current = null
      if (seconds > 0) capture("hero_time", { seconds })
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (entered.current == null) entered.current = performance.now()
          return
        }
        flush()
      },
      { threshold: 0.35 },
    )
    observer.observe(hero)
    const onHide = () => flush()
    window.addEventListener("pagehide", onHide)
    return () => {
      flush()
      observer.disconnect()
      window.removeEventListener("pagehide", onHide)
    }
  }, [])

  return null
}

export default function App() {
  const [labMode, setLabMode] = useState(false)
  const [path, setPath] = useState(currentPath)
  const [bootLab, setBootLab] = useState(false)
  const pendingScroll = useRef<string | null>(null)
  const isProjectsPage = path === PROJECTS_PATH

  useEffect(() => {
    if (isProjectsPage) return
    const boot = () => setBootLab(true)
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(boot, { timeout: 200 })
      return () => cancelIdleCallback(id)
    }
    const timer = window.setTimeout(boot, 50)
    return () => window.clearTimeout(timer)
  }, [isProjectsPage])

  useEffect(() => {
    capturePageview(path)
  }, [path])

  useEffect(() => {
    const onPop = () => setPath(currentPath())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    if (isProjectsPage || labMode) return
    const id = pendingScroll.current
    if (!id) return
    pendingScroll.current = null
    const node = document.getElementById(id)
    requestAnimationFrame(() => {
      if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
      else window.scrollTo(0, 0)
    })
  }, [path, isProjectsPage, labMode])

  useEffect(() => {
    document.body.style.overflow = labMode ? "hidden" : ""
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLabMode(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [labMode])

  const go = (to: string) => {
    const next = to.replace(/\/+$/, "") || "/"
    if (next === path) return
    window.history.pushState({}, "", next)
    setPath(next)
  }

  const jump = (id: string) => {
    pendingScroll.current = id
    if (labMode) {
      setLabMode(false)
      if (isProjectsPage) go("/")
      return
    }
    if (isProjectsPage) {
      go("/")
      return
    }
    pendingScroll.current = null
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const openProjectsPage = () => {
    setLabMode(false)
    go(PROJECTS_PATH)
    window.scrollTo(0, 0)
  }

  const enterLab = () => {
    capture("cta_clicked", { cta: "enter_lab" })
    if (isProjectsPage) {
      go("/")
      window.scrollTo(0, 0)
    }
    setLabMode(true)
  }

  return (
    <div className={labMode ? "app is-lab" : "app"}>
      <nav className="top-nav">
        <button type="button" className="brand" onClick={() => jump("hero")}>
          Bruno's <em>Lab</em>
        </button>
        <div className="top-links">
          {site.nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.id === "projects" && isProjectsPage ? window.scrollTo({ top: 0, behavior: "smooth" }) : jump(item.id))}
            >
              <span>{item.index}</span>
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="cta nav-cta" onClick={enterLab}>
          Entrar no lab
        </button>
      </nav>

      {isProjectsPage ? (
        <ProjectsPage onBack={() => jump("projects")} />
      ) : (
        <>
          <header className="lab-chrome">
            <button type="button" className="ghost" onClick={() => setLabMode(false)}>
              Sair do lab
            </button>
            <span className="ghost">Arraste para olhar · Esc volta</span>
          </header>

          <section className="hero" id="hero">
            <HeroTimeTracker />
            {bootLab ? (
              <Suspense
                fallback={
                  <div className="hero-canvas lab-canvas-fallback">
                    <div className="lab-loading">
                      <span>Preparando o lab</span>
                      <span className="lab-loading-bar" aria-hidden>
                        <span style={{ width: "8%" }} />
                      </span>
                    </div>
                  </div>
                }
              >
                <LabCanvas
                  labMode={labMode}
                  onPoster={() => jump("about")}
                  onMonitor={() => jump("projects")}
                />
              </Suspense>
            ) : (
              <div className="hero-canvas lab-canvas-fallback">
                <div className="lab-loading">
                  <span>Preparando o lab</span>
                  <span className="lab-loading-bar" aria-hidden>
                    <span style={{ width: "8%" }} />
                  </span>
                </div>
              </div>
            )}
            <div className="hero-overlay">
              <div className="hero-copy">
                <div className="hero-kicker">
                  <span />
                  {site.name}
                </div>
                <h1>
                  BRUNO'S <em>LAB</em>
                </h1>
                <p>{site.tagline}</p>
                <div className="values">
                  {site.values.map((value) => (
                    <span key={value.id}>{value.label}</span>
                  ))}
                </div>
                <button type="button" className="cta" onClick={enterLab}>
                  Entrar no lab
                  <span aria-hidden>→</span>
                </button>
              </div>
            </div>
          </section>

          <LabVolume visible={labMode} />
          <p className="lab-hint">Clique nos posters ou no monitor para voltar à info</p>

          <Sections onSeeAll={openProjectsPage} />
        </>
      )}

      <footer className="site-foot">
        <strong>
          Bruno's <em>Lab</em>
        </strong>
        <span className="online-pill">Online</span>
        <span>Build · Solve · Iterate · Repeat</span>
        <small>© 2026 Bruno Guimarães</small>
      </footer>
    </div>
  )
}
