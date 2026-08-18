import { type ReactNode, useEffect } from "react"
import posthog from "posthog-js"
import { isAnalyticsEnabled, posthogHost, posthogKey } from "../lib/analytics"

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isAnalyticsEnabled()) return

    posthog.init(posthogKey(), {
      api_host: posthogHost(),
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    })
  }, [])

  return children
}
