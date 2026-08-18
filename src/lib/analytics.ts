import posthog from "posthog-js"

export function posthogKey() {
  return import.meta.env.NEXT_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY || ""
}

export function posthogHost() {
  return (
    import.meta.env.NEXT_PUBLIC_POSTHOG_HOST ||
    import.meta.env.VITE_POSTHOG_HOST ||
    "https://app.posthog.com"
  )
}

export function isAnalyticsEnabled() {
  return import.meta.env.PROD && Boolean(posthogKey())
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled()) return
  posthog.capture(event, properties)
}

export function capturePageview(path: string) {
  capture("$pageview", {
    $current_url: typeof window === "undefined" ? path : window.location.href,
    path,
  })
}
