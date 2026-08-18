import { ProjectGrid } from "./ProjectGrid"
import { site } from "../data/site"

export function ProjectsPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="band projects-page">
      <button type="button" className="ghost projects-back" onClick={onBack}>
        ← Voltar
      </button>
      <p className="band-kicker">02 — Projects</p>
      <h2>Todos os projetos</h2>
      <p className="projects-lead">Sites, posts e estudos — do produto ao experimento.</p>
      <ProjectGrid projects={site.projects} />
    </section>
  )
}
