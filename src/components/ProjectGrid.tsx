import { useRef, type MouseEvent, type ReactNode, type RefObject } from "react"
import { site } from "../data/site"

export type Project = (typeof site.projects)[number]

export function projectHref(project: Project) {
  return "href" in project ? project.href : undefined
}

function Icon({ type }: { type: Project["icon"] }) {
  if (type === "brand") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          d="M8 26V10l8-5 8 5v16H8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M14 26v-8h4v8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 14h2M18 14h2M12 18h2M18 18h2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (type === "cart") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          d="M6 8h2l2.4 11h13.2L26 12H11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="14" cy="24" r="1.6" fill="currentColor" />
        <circle cx="22" cy="24" r="1.6" fill="currentColor" />
      </svg>
    )
  }
  if (type === "pad") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <rect x="5" y="10" width="22" height="13" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 16h4M13 14v4M20 15.5h.01M23 18h.01" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (type === "plan") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          d="M6 8h12v16H6zM18 14h8v10h-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M10 12h4M10 16h4M10 20h4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (type === "video") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <rect x="5" y="8" width="22" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 12.5v7l7-3.5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  if (type === "health") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          d="M13 6h6v5h5v6h-5v5h-6v-5H8v-6h5V6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path
        d="M8 10h16a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H14l-5 4v-4H8a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function TiltCard({
  children,
  className,
  href,
}: {
  children: ReactNode
  className: string
  href?: string
}) {
  const ref = useRef<HTMLElement>(null)

  const onMove = (event: MouseEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`)
    el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`)
    el.style.setProperty("--ty", "-8px")
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--ry", "0deg")
    el.style.setProperty("--ty", "0px")
  }

  if (href) {
    return (
      <a
        ref={ref as RefObject<HTMLAnchorElement>}
        className={`${className} is-link`}
        href={href}
        target="_blank"
        rel="noreferrer"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {children}
      </a>
    )
  }

  return (
    <article ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </article>
  )
}

export function ProjectGrid({ projects }: { projects: readonly Project[] }) {
  return (
    <div className="project-grid">
      {projects.map((project) => {
        const href = projectHref(project)
        return (
          <TiltCard key={project.name} className="project-card" href={href}>
            <span className="project-icon">
              <Icon type={project.icon} />
            </span>
            <h3>{project.name}</h3>
            <p>{project.blurb}</p>
            <small>{project.tech}</small>
            {href ? (
              <span className="project-go" aria-hidden>
                →
              </span>
            ) : null}
          </TiltCard>
        )
      })}
    </div>
  )
}
