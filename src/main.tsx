import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { PostHogProvider } from "./components/PostHogProvider"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider>
      <App />
    </PostHogProvider>
  </StrictMode>,
)
