import posthog from "posthog-js"

function readEnv(...keys: Array<string | undefined>) {
  for (const value of keys) {
    const cleaned = sanitize(value)
    if (cleaned) return cleaned
  }
  return ""
}

function sanitize(value?: string) {
  if (!value) return ""
  return value
    .trim()
    .replace(/^VITE_POSTHOG_PROJECT_TOKEN=/i, "")
    .replace(/^VITE_POSTHOG_KEY=/i, "")
    .replace(/^NEXT_PUBLIC_POSTHOG_KEY=/i, "")
    .replace(/^VITE_POSTHOG_HOST=/i, "")
    .replace(/^NEXT_PUBLIC_POSTHOG_HOST=/i, "")
    .replace(/\s+/g, "")
    .trim()
}

export function posthogKey() {
  return readEnv(
    import.meta.env.NEXT_PUBLIC_POSTHOG_KEY,
    import.meta.env.VITE_POSTHOG_KEY,
    import.meta.env.VITE_POSTHOG_PROJECT_TOKEN,
  )
}

export function posthogHost() {
  return (
    readEnv(import.meta.env.NEXT_PUBLIC_POSTHOG_HOST, import.meta.env.VITE_POSTHOG_HOST) ||
    "https://us.i.posthog.com"
  )
}

export function isAnalyticsEnabled() {
  return import.meta.env.PROD && Boolean(posthogKey())
}

let started = false

export function initAnalytics() {
  if (started || typeof window === "undefined" || !isAnalyticsEnabled()) return
  started = true
  posthog.init(posthogKey(), {
    api_host: posthogHost(),
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  })
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled()) return
  initAnalytics()
  posthog.capture(event, properties)
}

export function capturePageview(path: string) {
  capture("$pageview", {
    $current_url: typeof window === "undefined" ? path : window.location.href,
    path,
  })
}

if (typeof window !== "undefined") initAnalytics()
