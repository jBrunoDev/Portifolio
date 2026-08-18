import { type CSSProperties } from "react"
import { ProjectGrid } from "./ProjectGrid"
import { site } from "../data/site"
import portrait from "../assets/bruno_lowPolly.webp"

const FEATURED_COUNT = 3

export function Sections({ onSeeAll }: { onSeeAll: () => void }) {
  const featured = site.projects.slice(0, FEATURED_COUNT)

  return (
    <div className="bands">
      <section className="band about-band" id="about">
        <div className="band-copy">
          <p className="band-kicker">01 — About</p>
          <h2>Sobre mim</h2>
          <div className="about-meta">
            <span>{site.person.role}</span>
            <span>{site.person.study}</span>
            <span>{site.person.location}</span>
          </div>
          <p>{site.person.bio}</p>
        </div>
        <figure className="portrait">
          <img src={portrait} alt={site.person.name} loading="lazy" decoding="async" />
          <figcaption>
            <strong>{site.person.name}</strong>
            <span>{site.person.role}</span>
          </figcaption>
        </figure>
      </section>

      <section className="band projects-band" id="projects">
        <div className="band-head">
          <div>
            <p className="band-kicker">02 — Projects</p>
            <h2>Projetos que ganham vida</h2>
          </div>
          <button type="button" className="ghost see-all" onClick={onSeeAll}>
            Ver todos
          </button>
        </div>
        <ProjectGrid projects={featured} />
      </section>

      <section className="band stack-band" id="stack">
        <p className="band-kicker">03 — Stack</p>
        <h2>Tecnologias que uso</h2>
        <div className="tech-row">
          {site.stack.map((item) => (
            <div
              key={item.name}
              className="tech-chip"
              style={{ "--chip": item.color } as CSSProperties}
            >
              <span className="tech-dot" style={{ background: item.color }} />
              {item.name}
            </div>
          ))}
        </div>
      </section>

      <section className="band exp-band" id="experience">
        <p className="band-kicker">04 — Experience</p>
        <h2>Minha jornada como dev</h2>
        <div className="journey">
          {site.experience.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.meta}</p>
              <small>{item.when}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="band contact-band" id="contact">
        <div className="band-copy">
          <p className="band-kicker">05 — Contact</p>
          <h2>Vamos criar algo juntos?</h2>
          <p>Me chama no e-mail, no WhatsApp ou nas redes. Respondo rápido.</p>
          <a className="cta" href={`mailto:${site.person.email}`}>
            Enviar e-mail
          </a>
        </div>
        <div className="contact-panel">
          <a href={`mailto:${site.person.email}`}>{site.person.email}</a>
          <a href={site.person.phoneHref}>{site.person.phone}</a>
          <span>{site.person.location}</span>
          <div className="socials">
            {site.socials.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
