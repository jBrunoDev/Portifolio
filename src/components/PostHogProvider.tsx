import { type ReactNode, useEffect } from "react"
import { initAnalytics } from "../lib/analytics"

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return children
}
