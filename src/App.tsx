import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { LabVolume } from "./components/LabVolume"
import { ProjectsPage } from "./components/ProjectsPage"
import { Sections } from "./components/Sections"
import { site } from "./data/site"
import "./index.css"

const LabCanvas = lazy(async () => {
  const mod = await import("./components/LabCanvas")
  return { default: mod.LabCanvas }
})

const PROJECTS_PATH = "/projetos"

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/"
}

export default function App() {
  const [labMode, setLabMode] = useState(false)
  const [path, setPath] = useState(currentPath)
  const pendingScroll = useRef<string | null>(null)
  const isProjectsPage = path === PROJECTS_PATH

  useEffect(() => {
    const onPop = () => setPath(currentPath())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    if (isProjectsPage) return
    const id = pendingScroll.current
    if (!id) return
    pendingScroll.current = null
    const node = document.getElementById(id)
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
    else window.scrollTo(0, 0)
  }, [path, isProjectsPage])

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
    setLabMode(false)
    if (isProjectsPage) {
      pendingScroll.current = id
      go("/")
      return
    }
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const openProjectsPage = () => {
    setLabMode(false)
    go(PROJECTS_PATH)
    window.scrollTo(0, 0)
  }

  const enterLab = () => {
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
            <Suspense fallback={<div className="hero-canvas lab-canvas-fallback" />}>
              <LabCanvas
                labMode={labMode}
                onPoster={() => jump("about")}
                onMonitor={() => jump("projects")}
              />
            </Suspense>
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
